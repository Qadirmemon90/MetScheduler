import mongoose from "mongoose";
import dns from "node:dns";
import axios from "axios";
// Helper to convert mongodb+srv:// to direct replica set endpoints if local SRV UDP lookup fails
async function resolveSrvUri(srvUri) {
    const match = srvUri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)(\/[^?]*)?(\?.*)?$/);
    if (!match)
        return srvUri;
    const [, username, password, host, database = "", searchParams = ""] = match;
    try {
        let srvRecords = [];
        let txtData = "";
        try {
            const dohRes = await axios.get(`https://dns.google/resolve?name=_mongodb._tcp.${host}&type=SRV`, { timeout: 4000 });
            if (dohRes.data?.Answer) {
                srvRecords = dohRes.data.Answer.map((ans) => {
                    const parts = ans.data.split(" ");
                    return { port: Number(parts[2]), name: parts[3].replace(/\.$/, "") };
                });
            }
            const txtRes = await axios.get(`https://dns.google/resolve?name=${host}&type=TXT`, { timeout: 4000 });
            if (txtRes.data?.Answer?.[0]?.data) {
                txtData = txtRes.data.Answer[0].data.replace(/^"|"$/g, "");
            }
        }
        catch {
            try {
                const cfRes = await axios.get(`https://cloudflare-dns.com/dns-query?name=_mongodb._tcp.${host}&type=SRV`, {
                    headers: { accept: "application/dns-json" },
                    timeout: 4000,
                });
                if (cfRes.data?.Answer) {
                    srvRecords = cfRes.data.Answer.map((ans) => {
                        const parts = ans.data.split(" ");
                        return { port: Number(parts[2]), name: parts[3].replace(/\.$/, "") };
                    });
                }
                const cfTxt = await axios.get(`https://cloudflare-dns.com/dns-query?name=${host}&type=TXT`, {
                    headers: { accept: "application/dns-json" },
                    timeout: 4000,
                });
                if (cfTxt.data?.Answer?.[0]?.data) {
                    txtData = cfTxt.data.Answer[0].data.replace(/^"|"$/g, "");
                }
            }
            catch { }
        }
        if (srvRecords.length > 0) {
            const hosts = srvRecords.map((r) => `${r.name}:${r.port}`).join(",");
            const params = new URLSearchParams(searchParams.replace(/^\?/, ""));
            params.set("ssl", "true");
            if (txtData) {
                const txtParams = new URLSearchParams(txtData);
                for (const [k, v] of txtParams.entries()) {
                    if (!params.has(k))
                        params.set(k, v);
                }
            }
            if (!params.has("authSource"))
                params.set("authSource", "admin");
            return `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${hosts}${database}?${params.toString()}`;
        }
    }
    catch { }
    return srvUri;
}
let isConnecting = false;
const connectDB = async () => {
    if (mongoose.connection.readyState === 1)
        return true;
    if (isConnecting)
        return false;
    isConnecting = true;
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MongoDB Error: MONGODB_URI is not defined in server/.env");
        isConnecting = false;
        return false;
    }
    // Strategy 1: Standard connection
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
        console.log("MongoDB Connected Successfully");
        isConnecting = false;
        return true;
    }
    catch (err) {
        console.warn("Primary MongoDB connection attempt:", err?.message || err);
    }
    // Strategy 2: If SRV lookup failed, resolve via DNS-over-HTTPS (DoH)
    try {
        const directUri = await resolveSrvUri(uri);
        if (directUri !== uri) {
            console.log("Retrying MongoDB connection using direct cluster endpoints...");
            await mongoose.connect(directUri, { serverSelectionTimeoutMS: 10000 });
            console.log("MongoDB Connected Successfully via direct endpoints");
            isConnecting = false;
            return true;
        }
    }
    catch (err) {
        console.warn("Direct endpoints connection attempt:", err?.message || err);
    }
    // Strategy 3: Try Google Public DNS fallback
    try {
        dns.setServers(["8.8.8.8", "1.1.1.1"]);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
        console.log("MongoDB Connected Successfully with Google DNS");
        isConnecting = false;
        return true;
    }
    catch (err) {
        console.error("MongoDB Connection Warning:", err?.message || err);
        console.log("Tip: Ensure your current IP is whitelisted in MongoDB Atlas Network Access (Allow 0.0.0.0/0).");
    }
    isConnecting = false;
    // Retry periodically in background without spamming
    setTimeout(() => {
        connectDB().catch(() => { });
    }, 20000);
    return false;
};
export default connectDB;
