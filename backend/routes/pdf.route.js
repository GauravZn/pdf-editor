import express from "express";
import upload from "../utils/upload.js";

const router = express.Router();

router.post("/upload", upload.single("pdf"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  res.json({
    message: "PDF uploaded successfully",
    fileName: req.file.filename,
    filePath: req.file.path,
    size: req.file.size
  });
});

export default router;