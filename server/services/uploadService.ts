import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { cloudinary } from "../config/cloudinary.js";

const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export interface UploadResult {
  url: string;
  publicId?: string;
}

export const uploadImageBuffer = async (
  buffer: Buffer,
  mimetype: string,
  folder = "metscheduler/payments",
): Promise<UploadResult> => {
  // Check if Cloudinary credentials are valid
  const hasCloudinary =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME !== "your_cloudinary_cloud_name";

  if (hasCloudinary) {
    try {
      const base64Data = buffer.toString("base64");
      const dataUri = `data:${mimetype};base64,${base64Data}`;

      const res = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: "image",
      });

      return {
        url: res.secure_url || res.url,
        publicId: res.public_id,
      };
    } catch (err: any) {
      console.warn("Cloudinary upload failed, using local storage fallback:", err?.message || err);
    }
  }

  // Local file storage fallback
  const ext = mimetype.split("/")[1] || "png";
  const filename = `${crypto.randomBytes(16).toString("hex")}.${ext}`;
  const filepath = path.join(uploadsDir, filename);
  fs.writeFileSync(filepath, buffer);

  return {
    url: `/uploads/${filename}`,
    publicId: filename,
  };
};
