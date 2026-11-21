import zernio from "../config/zernio.js";
import { User } from "../models/user.js";
import { Account } from "../models/Accounts.js";
const SUPPORTED_OAUTH_PLATFORMS = new Set([
    "facebook",
    "instagram",
    "linkedin",
    "twitter",
    "tiktok",
    "youtube",
    "threads",
    "reddit",
    "pinterest",
    "bluesky",
    "googlebusiness",
    "telegram",
    "snapchat",
    "discord",
    "whatsapp",
]);
const getClientOrigin = (req) => {
    const headerOrigin = req.headers.origin;
    if (typeof headerOrigin === "string" && headerOrigin.startsWith("http")) {
        return headerOrigin;
    }
    const referer = req.headers.referer;
    if (typeof referer === "string" && referer.startsWith("http")) {
        try {
            const url = new URL(referer);
            return url.origin;
        }
        catch { }
    }
    return process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173";
};
const getProviderMessage = (error) => error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.data?.message ||
    error?.data?.error ||
    error?.error?.message ||
    error?.error ||
    error?.message ||
    "Social account connection could not be started right now.";
const isAdminSetupRequiredError = (message) => /payment method|connect more than 2 accounts|pass-through costs/i.test(message);
const getPlatformLabel = (platform) => {
    const labels = {
        facebook: "Facebook",
        instagram: "Instagram",
        linkedin: "LinkedIn",
        twitter: "Twitter / X",
    };
    return labels[platform] || platform.charAt(0).toUpperCase() + platform.slice(1);
};
//Helper to ensure user has a Zernio Profile
const getOrCreateZernioProfile = async (user) => {
    try {
        if (user.zernioProfileId) {
            return user.zernioProfileId;
        }
        const createResult = await zernio.profiles.createProfile({
            body: { name: `${user.name || user.email} workspace` },
        });
        const created = createResult.data?.profile || createResult.data;
        const pid = created?._id || created?.id;
        if (!pid) {
            throw new Error("Failed to create zernio profile - no ID returned");
        }
        await User.findByIdAndUpdate(user._id, { zernioProfileId: pid });
        return pid;
    }
    catch (error) {
        console.error("getorCreateZernioProfile Error:", error?.message || error);
        throw error;
    }
};
// generate OAuth authoization Url
// GET /api/auth/:platform
export const generateAuthUrl = async (req, res) => {
    try {
        const platform = String(req.params.platform || "").toLowerCase();
        if (!SUPPORTED_OAUTH_PLATFORMS.has(platform)) {
            res.status(400).json({ message: "This platform is not supported for OAuth connection." });
            return;
        }
        if (!process.env.ZERNIO_API_KEY) {
            res.status(503).json({
                message: "Social connection is not configured yet. Please add the Zernio API key on the server.",
            });
            return;
        }
        const profileId = await getOrCreateZernioProfile(req.user);
        const redirectUrl = `${getClientOrigin(req).replace(/\/$/, "")}/accounts`;
        const result = await zernio.connect.getConnectUrl({
            path: { platform: platform },
            query: {
                profileId,
                redirect_url: redirectUrl,
            },
        });
        const data = result.data;
        console.log("getConnectUrl response:", JSON.stringify(data, null, 2));
        const authUrl = data?.authUrl || data?.url;
        if (!authUrl) {
            console.error("Zernio returned no authUrl:", data || result);
            throw new Error("Social account connection could not be started right now. Please try again in a moment.");
        }
        res.json({ url: authUrl });
    }
    catch (error) {
        const providerMessage = getProviderMessage(error);
        console.error("generateAuthUrl Error:", error?.response?.data || error?.data || error?.message || error);
        if (isAdminSetupRequiredError(providerMessage)) {
            res.json({
                requiresAdminSetup: true,
                message: `Your plan allows ${getPlatformLabel(String(req.params.platform || ""))} connection, but admin-side social provider setup is required before OAuth can start. Please contact support on WhatsApp. No user payment method is required.`,
            });
            return;
        }
        res.status(502).json({ message: providerMessage });
    }
};
// Sync connected accounts from Zernio into MongoDB
// GET /api/auth/sync
export const syncAccounts = async (req, res) => {
    try {
        const profileId = await getOrCreateZernioProfile(req.user);
        const result = await zernio.accounts.listAccounts({
            query: { profileId },
        });
        const data = result.data;
        const zernioAccounts = data?.accounts || data?.data || (Array.isArray(data) ? data : []);
        const normalizePlatform = (raw) => {
            const p = (raw || "").toLowerCase().trim();
            if (p === "x" || p.includes("twitter"))
                return "twitter";
            if (p.includes("linkedin"))
                return "linkedin";
            if (p.includes("facebook"))
                return "facebook";
            if (p.includes("instagram"))
                return "instagram";
            if (p.includes("threads"))
                return "threads";
            if (p.includes("tiktok"))
                return "tiktok";
            if (p.includes("youtube"))
                return "youtube";
            if (p.includes("pinterest"))
                return "pinterest";
            if (p.includes("reddit"))
                return "reddit";
            if (p.includes("bluesky"))
                return "bluesky";
            return p;
        };
        const syncedAccounts = [];
        for (const zAccount of zernioAccounts) {
            const zid = zAccount._id || zAccount.id;
            if (!zid) {
                console.warn("Skipping account with no ID:", zAccount);
                continue;
            }
            const rawPlatform = zAccount.platform || zAccount.type || "";
            const normalizedPlatform = normalizePlatform(rawPlatform);
            const account = await Account.findOneAndUpdate({ user: req.user._id, zernioAccountId: zid }, {
                user: req.user._id,
                platform: normalizedPlatform,
                handle: zAccount.username || zAccount.name || zAccount.handle || "Social Account",
                zernioAccountId: zid,
                status: "connected",
                avatarUrl: zAccount.avatarUrl ||
                    zAccount.picture ||
                    zAccount.profile_image_url ||
                    zAccount.profile_image_Url,
            }, {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            });
            if (account) {
                syncedAccounts.push(account);
            }
        }
        res.json(syncedAccounts);
    }
    catch (error) {
        console.error("syncAccounts Error:", error?.response?.data || error?.message || error);
        res.status(500).json({ message: error?.response?.data?.message || error?.message || "Server error" });
    }
};
