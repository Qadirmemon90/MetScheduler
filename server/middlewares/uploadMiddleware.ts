import multer from "multer";

const storage = multer.memoryStorage();

export const uploadSingleImage = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max screenshot
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (PNG, JPG, JPEG, WEBP) are allowed for payment proof"));
    }
  },
}).single("screenshot");
