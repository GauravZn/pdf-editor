import express from "express";
import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import forge from "node-forge";
import pool from "../db.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

/* ---------- helpers ---------- */
const normalizePem = (pem) =>
  pem.replace(/\\n/g, "\n").trim();

const dbSafeKey = (pem) =>
  pem.replace(/-----.*?-----/g, "").replace(/\n/g, "").trim();

/* ---------- multer ---------- */
const upload = multer({ dest: "uploads/esign/" });

/* ---------- upload pdf ---------- */
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    const buffer = fs.readFileSync(req.file.path);

    const hash = crypto
      .createHash("sha256")
      .update(buffer)
      .digest("hex");

    const pdfId = uuidv4();

    await pool.query(
      `INSERT INTO pdf_documents (id, file_path, pdf_hash)
       VALUES ($1,$2,$3)`,
      [pdfId, req.file.path, hash]
    );

    res.json({ pdfId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
});

/* ---------- sign pdf ---------- */
router.post("/sign", auth, async (req, res) => {
     res.json({msg:"pewdiepie"})
  
});

export default router;

















