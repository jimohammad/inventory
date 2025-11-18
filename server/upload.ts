import { Router } from "express";
import multer from "multer";
import { storagePut } from "./storage";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB
  },
});

export const uploadRouter = Router();

uploadRouter.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileKey = req.body.fileKey || `uploads/${Date.now()}-${req.file.originalname}`;
    const contentType = req.body.contentType || req.file.mimetype;

    const { url } = await storagePut(fileKey, req.file.buffer, contentType);

    res.json({ url, key: fileKey });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});
