import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import { cloudinary } from "../config/cloudinary.js";
import { Generation } from "../models/Generation.js";
import { Post } from "../models/Post.js";
import { getConnectedAccountsForPlatforms, isSocialPlatform, } from "../services/publishService.js";
const pollLeonardJob = async (generationId, apiKey) => {
    const maxRetries = 20;
    const delay = 5000;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await axios.get(`https://cloud.leonardo.ai/api/rest/v1/generation/${generationId}`, {
                headers: {
                    accept: "application/json",
                    authorization: `Bearer ${apiKey}`,
                },
            });
            const generation = response.data.generations_by_pk;
            if (generation.status === "COMPLETE") {
                if (generation.generated_images &&
                    generation.generated_images.length > 0) {
                    return generation.generated_images[0].url;
                }
                throw new Error("Generation complete but no images found.");
            }
            if (generation.status === "FAILED") {
                throw new Error("Leonardo.ai generation failed");
            }
        }
        catch (err) {
            console.error("Polling error:", err?.response?.data || err.message);
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
    throw new Error("Leonardo.ai generation timed out");
};
// Generate post
// POST /api/posts/generate
export const generatePost = async (req, res) => {
    try {
        const { prompt, tone, generateImage } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            res.status(400).json({
                message: "Gemini API Key is missing. Please add it to your server/.env file.",
            });
            return;
        }
        const ai = new GoogleGenAI({ apiKey });
        // Generate Text
        const textResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a social media post based on this prompt: "${prompt}".
        Tone: ${tone}.
        Include relevate hashtags.
        Format the response as JSON with "content" and "imagePrompt" fields.
        The "imagePrompt" should be a highly descriptive prompt for an image generator 
        the complements th post.`,
        });
        let content = "";
        let imagePrompt = prompt;
        try {
            const rawText = textResponse.text || "";
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            const data = jsonMatch
                ? JSON.parse(jsonMatch[0])
                : { content: rawText, imagePrompt: prompt };
            content = data.content;
            imagePrompt = data.imagePrompt;
        }
        catch (e) {
            content = textResponse.text || "";
        }
        let mediaUrl = "";
        if (generateImage) {
            try {
                const leonardoKey = process.env.LEONARDO_API_KEY;
                if (leonardoKey) {
                    // Use Leonardo.ai for image generation
                    const leoResponse = await axios.post("https://cloud.leonardo.ai/api/rest/v2/generations", {
                        public: false,
                        model: "gpt-image-1.5",
                        parameters: {
                            quality: "LOW",
                            prompt: imagePrompt,
                            quantity: 1,
                            width: 1024,
                            height: 1024,
                            prompt_enhance: "OFF",
                        },
                    }, {
                        headers: {
                            accept: "application/json",
                            authorization: `Bearer ${leonardoKey}`,
                            "Content-Type": "application/json",
                        },
                    });
                    const generationId = leoResponse.data.generate.generationId;
                    const tempUrl = await pollLeonardJob(generationId, leonardoKey);
                    // Upload to Cloudinary for persistence
                    const uploadResult = await cloudinary.uploader.upload(tempUrl, {
                        folder: "ai-generations",
                    });
                    mediaUrl = uploadResult.secure_url;
                }
            }
            catch (err) {
                console.error("Image generation failed:", err);
            }
        }
        // Save generation to DB
        const generation = await Generation.create({
            user: req.user._id,
            prompt,
            content,
            mediaUrl,
            mediaType: mediaUrl ? "image" : undefined,
            tone,
        });
        res.json(generation);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
// Get generations
// POST /api/posts/generations
export const getGenerations = async (req, res) => {
    try {
        const generations = await Generation.find({ user: req.user._id }).sort({
            createdAt: -1,
        });
        res.json(generations);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
// Get post
// POST /api/posts
export const getPosts = async (req, res) => {
    try {
        const posts = await Post.find({ user: req.user._id });
        res.json(posts);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
// Schedule post
// POST /api/posts
export const schedulePost = async (req, res) => {
    try {
        const { content, platforms, scheduledFor } = req.body;
        //Parse platforrms if it comes as a stringified array from FromData
        let parsedPlatforms = platforms;
        if (typeof platforms === "string") {
            try {
                parsedPlatforms = JSON.parse(platforms);
            }
            catch (e) {
                parsedPlatforms = platforms.split(",");
            }
        }
        let mediaUrl = req.body.mediaUrl;
        let mediaType = req.body.mediaType;
        if (!content || !content.trim()) {
            res.status(400).json({ message: "Post content is required" });
            return;
        }
        if (!Array.isArray(parsedPlatforms)) {
            res.status(400).json({ message: "Platforms must be an array" });
            return;
        }
        const normalizedPlatforms = [
            ...new Set(parsedPlatforms
                .map((platform) => platform?.trim().toLowerCase())
                .filter(Boolean)),
        ];
        if (normalizedPlatforms.length === 0) {
            res.status(400).json({ message: "Select at least one platform" });
            return;
        }
        const invalidPlatforms = normalizedPlatforms.filter((platform) => !isSocialPlatform(platform));
        if (invalidPlatforms.length > 0) {
            res.status(400).json({
                message: `Unsupported platform: ${invalidPlatforms.join(", ")}`,
            });
            return;
        }
        const selectedPlatforms = normalizedPlatforms;
        const scheduledDate = new Date(scheduledFor);
        if (Number.isNaN(scheduledDate.getTime())) {
            res.status(400).json({ message: "A valid scheduled date is required" });
            return;
        }
        if (selectedPlatforms.includes("instagram") && !mediaUrl && !req.file) {
            res.status(400).json({ message: "Instagram posts require media" });
            return;
        }
        const connectedAccounts = await getConnectedAccountsForPlatforms(req.user._id, selectedPlatforms);
        const connectedPlatforms = new Set(connectedAccounts.map((account) => account.platform));
        const missingPlatforms = selectedPlatforms.filter((platform) => !connectedPlatforms.has(platform));
        if (missingPlatforms.length > 0) {
            res.status(400).json({
                message: `Connect ${missingPlatforms.join(", ")} before scheduling this post`,
            });
            return;
        }
        if (req.file) {
            try {
                const result = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream({ resource_type: "auto", folder: "social-scheduler" }, (error, result) => {
                        if (error)
                            reject(error);
                        else
                            resolve(result);
                    });
                    stream.end(req.file.buffer);
                });
                mediaUrl = result.secure_url;
                mediaType = result.resource_type === "video" ? "video" : "image";
            }
            catch (cloudErr) {
                console.error("Cloudinary upload error:", cloudErr?.message || cloudErr);
                // include extra details if available
                if (cloudErr?.http_code)
                    console.error("Cloudinary http_code:", cloudErr.http_code);
                if (cloudErr?.error)
                    console.error("Cloudinary error object:", cloudErr.error);
                res.status(502).json({ message: "Failed to upload media to Cloudinary", details: cloudErr?.message || cloudErr });
                return;
            }
        }
        const post = await Post.create({
            user: req.user._id,
            content: content.trim(),
            platforms: selectedPlatforms,
            mediaUrl,
            mediaType,
            scheduledFor: scheduledDate,
            status: "scheduled",
        });
        res.status(201).json(post);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
