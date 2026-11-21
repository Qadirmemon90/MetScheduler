import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

const clean = (val?: string) => {
    if (!val) return "";
    // strip surrounding single or double quotes and whitespace
    return val.replace(/^\s*["']?/, "").replace(/["']?\s*$/, "").trim();
};

cloudinary.config({
    cloud_name: clean(process.env.CLOUDINARY_CLOUD_NAME),
    api_key: clean(process.env.CLOUDINARY_API_KEY),
    api_secret: clean(process.env.CLOUDINARY_API_SECRET),
});

export { cloudinary };