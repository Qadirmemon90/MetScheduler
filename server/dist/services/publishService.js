import { Account } from "../models/Accounts.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { Post } from "../models/Post.js";
import zernio from "../config/zernio.js";
export const SOCIAL_PLATFORMS = [
    "twitter",
    "linkedin",
    "facebook",
    "instagram",
    "facebook_page",
    "linkedin_page",
    "instagram_business",
];
export const isSocialPlatform = (platform) => SOCIAL_PLATFORMS.includes(platform);
const toZernioPlatform = (platform) => {
    if (platform === "facebook_page")
        return "facebook";
    if (platform === "linkedin_page")
        return "linkedin";
    if (platform === "instagram_business")
        return "instagram";
    return platform;
};
const getErrorPayload = (err) => err?.response?.data ||
    err?.data ||
    err?.cause?.message ||
    err?.message ||
    err;
const isTransientNetworkError = (err) => {
    const code = err?.cause?.code || err?.code;
    const message = `${err?.message || ""} ${err?.cause?.message || ""}`.toLowerCase();
    return (message.includes("fetch failed") ||
        message.includes("timeout") ||
        ["ECONNRESET", "ENOTFOUND", "ETIMEDOUT", "UND_ERR_CONNECT_TIMEOUT"].includes(code));
};
const formatFailureReason = (error) => {
    const reason = typeof error === "string" ? error : JSON.stringify(error, null, 2);
    return reason.length > 1000 ? `${reason.slice(0, 997)}...` : reason;
};
export const getConnectedAccountsForPlatforms = async (userId, platforms) => {
    return Account.find({
        user: userId,
        platform: { $in: platforms },
        status: "connected",
        zernioAccountId: { $exists: true, $ne: "" },
    });
};
export const publishPost = async (post) => {
    const accounts = await getConnectedAccountsForPlatforms(post.user, post.platforms);
    if (accounts.length === 0) {
        throw new Error("No connected social accounts found for this post");
    }
    const platforms = accounts.map((account) => ({
        platform: toZernioPlatform(account.platform),
        accountId: account.zernioAccountId,
    }));
    const body = {
        content: post.content,
        publishNow: true,
        platforms,
        ...(post.mediaUrl
            ? {
                mediaItems: [
                    {
                        type: post.mediaType || "image",
                        url: post.mediaUrl,
                    },
                ],
            }
            : {}),
    };
    console.log(`Publishing post ${post._id} to ${platforms
        .map((target) => target.platform)
        .join(", ")}`);
    const response = await zernio.posts.createPost({ body });
    const publishedPost = response.data?.post || response.data;
    if (!publishedPost) {
        throw new Error(`Zernio did not return a published post object: ${JSON.stringify(response.data)}`);
    }
    post.status = "published";
    post.failureReason = undefined;
    await post.save();
    await ActivityLog.create({
        user: post.user,
        actionType: "POST_PUBLISHED",
        description: `Published post to ${accounts
            .map((account) => account.platform)
            .join(", ")}`,
        relatedPost: post._id,
    });
    return {
        post,
        accounts,
        publishedPost,
    };
};
export const publishDuePosts = async (now = new Date()) => {
    const postsToPublish = await Post.find({
        status: "scheduled",
        scheduledFor: { $lte: now },
    });
    const results = [];
    for (const post of postsToPublish) {
        try {
            const result = await publishPost(post);
            results.push({
                post: post._id,
                status: "published",
                platforms: result.accounts.map((account) => account.platform),
                published: result.publishedPost,
            });
        }
        catch (err) {
            const error = getErrorPayload(err);
            console.error(`Failed to publish post ${post._id}:`, error);
            if (isTransientNetworkError(err)) {
                post.failureReason = formatFailureReason(error);
                await post.save();
                results.push({
                    post: post._id,
                    status: "retry_pending",
                    error,
                });
                continue;
            }
            post.status = "failed";
            post.failureReason = formatFailureReason(error);
            await post.save();
            results.push({
                post: post._id,
                status: "failed",
                error,
            });
        }
    }
    return {
        evaluated: postsToPublish.length,
        results,
    };
};
