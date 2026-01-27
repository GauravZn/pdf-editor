import express from "express";
import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import auth from "../middlewares/auth.middleware.js";
import { v4 as uuidv4 } from "uuid";
import pool from "../db.js";
import forge from "node-forge";


const router = express.Router();

// Route: register signer
router.post("/esign/register-signer", auth, async (req, res) => {
  const { pdfId, userEmail } = req.body;

  if (!pdfId || !userEmail) {
    return res.status(400).json({ message: "pdfId and userEmail required" });
  }

  try {
    // 🔑 Generate key pair
    const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
    const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
    const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);

    // 🔐 Return keys to user
    // ⚠️ Private key should be saved client-side securely, NOT backend
    res.json({
      publicKey: publicKeyPem,
      privateKey: privateKeyPem,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate keys" });
  }
});



/* -------------------- MULTER CONFIG -------------------- */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are allowed"));
    } else {
      cb(null, true);
    }
  },
});


const esignUpload = multer({
  dest: "uploads/esign/",
});

router.post(
  "/esign/upload",
  auth,
  esignUpload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No PDF uploaded" });
      }

      // 🔐 STEP 2.1: Read PDF file
      const fileBuffer = fs.readFileSync(req.file.path);

      // 🔐 STEP 2.2: Create SHA-256 hash
      const hash = crypto
        .createHash("sha256")
        .update(fileBuffer)
        .digest("hex");

      const pdfId = uuidv4();

      // 🔐 STEP 2.3: Store hash with document
      await pool.query(
        `
        INSERT INTO pdf_documents (id, file_path, pdf_hash)
        VALUES ($1, $2, $3)
        `,
        [pdfId, req.file.path, hash]
      );

      res.json({
        pdfId,
        hash,
        originalName: req.file.originalname,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to upload PDF" });
    }
  }
);

/* -------------------- WATERMARK ROUTE -------------------- */
router.post(
  "/watermark",
  auth,
  upload.single("file"),
  async (req, res) => {
    try {
      const {
        watermarkText,
        opacity,
        rotation,
        position,
        repeat,
      } = req.body;

      if (!req.file || !watermarkText) {
        return res.status(400).json({ message: "Missing data" });
      }

      // 🔴 IMPORTANT FIX
      const shouldRepeat = repeat === "true";

      const pdfDoc = await PDFDocument.load(req.file.buffer);
      const pages = pdfDoc.getPages();

      pages.forEach((page) => {
        const { width, height } = page.getSize();

        const textOptions = {
          size: 42,
          rotate: degrees(Number(rotation) || 45),
          opacity: Number(opacity) || 0.3,
          color: rgb(0.75, 0.75, 0.75),
        };

        if (!shouldRepeat) {
          // ✅ SINGLE WATERMARK
          let x = width / 2 - 160;
          let y = height / 2;

          if (position === "top") y = height - 120;
          if (position === "bottom") y = 80;

          page.drawText(watermarkText, {
            x,
            y,
            ...textOptions,
          });
        } else {
          // ✅ REPEATED WATERMARK
          const gapX = 280;
          const gapY = 220;

          for (let x = -100; x < width + 100; x += gapX) {
            for (let y = -100; y < height + 100; y += gapY) {
              page.drawText(watermarkText, {
                x,
                y,
                ...textOptions,
              });
            }
          }
        }
      });

      const modifiedPdf = await pdfDoc.save();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=watermarked.pdf"
      );

      res.send(Buffer.from(modifiedPdf));
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Watermark failed" });
    }
  }
);



/**
 * Sign PDF hash
 */


router.post("/esign/sign", auth, async (req, res) => {
  const { pdfId, privateKeyPem, publicKeyPem } = req.body;

  if (!pdfId || !privateKeyPem || !publicKeyPem) {
    return res.status(400).json({ message: "Missing required data" });
  }

  try {
    // 1️⃣ Get PDF hash from DB
    const pdfResult = await pool.query(
      "SELECT hash FROM pdf_documents WHERE id = $1",
      [pdfId]
    );

    if (pdfResult.rows.length === 0) {
      return res.status(404).json({ message: "PDF not found" });
    }

    const pdfHash = pdfResult.rows[0].hash;

    // 2️⃣ Load private key
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

    // 3️⃣ Sign the hash
    const md = forge.md.sha256.create();
    md.update(pdfHash, "utf8");

    const signature = forge.util.encode64(
      privateKey.sign(md)
    );

    // 4️⃣ Store signer info
    await pool.query(
      `
      INSERT INTO pdf_signers (pdf_id, user_email, public_key, signature)
      VALUES ($1, $2, $3, $4)
      `,
      [pdfId, req.user.email, publicKeyPem, signature]
    );

    res.json({
      message: "PDF signed successfully",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signing failed" });
  }
});

export default router;



// 38c9792d725c45dd431699e6a3b0f0f8e17c63c9ac7331387ee30dcc6e42a511
// 38C9792D725C45DD431699E6A3B0F0F8E17C63C9AC7331387EE30DCC6E42A511	