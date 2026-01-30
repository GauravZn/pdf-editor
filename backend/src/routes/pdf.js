import express from "express";
import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import auth from "../middlewares/auth.middleware.js";
import { v4 as uuidv4 } from "uuid";
import pool from "../db.js";
import forge from "node-forge";
import path from "path";

const PUBLIC_KEY_REGISTRY_PATH = path.resolve(
  process.cwd(),
  "secure",
  "temp.json"
);

function normalizePem(pem) {
  return pem.replace(/\r\n/g, "\n").trim();
}

function getEmailFromPublicKey(publicKeyPem) {
  if (!fs.existsSync(PUBLIC_KEY_REGISTRY_PATH)) {
    throw new Error("Public key registry not found");
  }

  const registry = JSON.parse(
    fs.readFileSync(PUBLIC_KEY_REGISTRY_PATH, "utf8")
  );

  const normalizedInputKey = normalizePem(publicKeyPem);

  // 🔍 registry is an OBJECT, not array
  for (const [email, record] of Object.entries(registry)) {
    if (!record?.publicKey) continue;

    const storedKey = normalizePem(record.publicKey);

    if (storedKey === normalizedInputKey) {
      return email;
    }
  }

  return null;
}


const router = express.Router();

/* -------------------- MULTER CONFIG -------------------- */
const uploadMemory = multer({
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

const uploadDisk = multer({
  dest: "uploads/esign/",
});

/* -------------------- PDF UPLOAD + HASH -------------------- */
router.post(
  "/esign/upload",
  auth,
  uploadDisk.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No PDF uploaded" });
      }

      const fileBuffer = fs.readFileSync(req.file.path);

      const hash = crypto
        .createHash("sha256")
        .update(fileBuffer)
        .digest("hex");

      const pdfId = uuidv4();

      await pool.query(
        `
        INSERT INTO pdf_documents (id, file_path, pdf_hash)
        VALUES ($1, $2, $3)
        `,
        [pdfId, req.file.path, hash]
      );
      console.log('file path---->', req.file.path)

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

/* -------------------- WATERMARK -------------------- */
router.post("/watermark",
  auth,
  uploadMemory.single("file"),
  async (req, res) => {
    try {
      const { watermarkText, opacity, rotation, position, repeat } = req.body;

      if (!req.file || !watermarkText) {
        return res.status(400).json({ message: "Missing data" });
      }

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
          let x = width / 2 - 160;
          let y = height / 2;

          if (position === "top") y = height - 120;
          if (position === "bottom") y = 80;

          page.drawText(watermarkText, { x, y, ...textOptions });
        } else {
          const gapX = 280;
          const gapY = 220;

          for (let x = -100; x < width + 100; x += gapX) {
            for (let y = -100; y < height + 100; y += gapY) {
              page.drawText(watermarkText, { x, y, ...textOptions });
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

/* -------------------- SIGN PDF HASH -------------------- */
router.post("/esign/sign", auth, async (req, res) => {
  const { pdfId, privateKeyPem, publicKeyPem } = req.body;

  if (!pdfId || !privateKeyPem || !publicKeyPem) {
    return res.status(400).json({ message: "Missing required data" });
  }

  try {
    /* 🔍 STEP 1: Resolve signer identity */
    const signerEmail = getEmailFromPublicKey(publicKeyPem);

    if (!signerEmail) {
      return res.status(403).json({
        message: "Public key not registered. Cannot identify signer."
      });
    }

    /* 🔐 STEP 1.5: VERIFY private key ↔ public key match */
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);

    const testMd = forge.md.sha256.create();
    testMd.update("key-ownership-test", "utf8");

    const testSignature = privateKey.sign(testMd);

    const isKeyPairValid = publicKey.verify(
      testMd.digest().bytes(),
      testSignature
    );

    if (!isKeyPairValid) {
      return res.status(400).json({
        message: "Public key does not match private key"
      });
    }


    /* 📄 STEP 2: Fetch PDF hash + path */
    const sigResult = await pool.query(
      `SELECT signature, public_key, signer_email
   FROM pdf_signatures
   WHERE pdf_id = $1`,
      [pdfId]
    );

    const pdfResult = await pool.query(
      `SELECT pdf_hash FROM pdf_documents WHERE id = $1`,
      [pdfId]
    );


    if (!pdfResult.rows.length) {
      return res.status(404).json({ message: "PDF not found" });
    }

    const { pdf_hash, file_path } = pdfResult.rows[0];

    /* ⛔ STEP 3: Prevent same signer signing twice */
    const alreadySigned = await pool.query(
      `
      SELECT 1 FROM pdf_signatures
      WHERE pdf_id = $1 AND signer_email = $2
      `,
      [pdfId, signerEmail]
    );

    if (alreadySigned.rows.length) {
      return res.status(409).json({
        message: "This signer has already signed the document"
      });
    }

    /* ✍️ STEP 4: Sign the PDF hash */
    // const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const md = forge.md.sha256.create();
    md.update(pdf_hash, "utf8");

    const signature = forge.util.encode64(privateKey.sign(md));

    /* 💾 STEP 5: Store signature */
    await pool.query(
      `
      INSERT INTO pdf_signatures
      (pdf_id, signer_email, public_key, signature, file_path)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        pdfId,
        signerEmail,
        publicKeyPem.trim(),
        signature,
        file_path
      ]
    );

    res.json({
      message: "✅ PDF signed successfully",
      signedBy: signerEmail
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signing failed" });
  }
});



router.post("/esign/verify", async (req, res) => {
  try {
    const { pdfId } = req.body;

    const result = await pool.query(
      `
  SELECT file_path, signature, public_key, signer_email
  FROM pdf_signatures
  WHERE pdf_id = $1
  `,
      [pdfId]
    );



    if (!result.rows.length) {
      return res.status(404).json({ message: "Signature not found" });
    }

    const { pdf_hash, signature, public_key } = result.rows[0];

    // 🔐 Load public key safely
    const cleanedPublicKey = public_key.replace(/\\n/g, "\n").trim();
    const publicKey = forge.pki.publicKeyFromPem(cleanedPublicKey);

    // 🔐 Verify SIGNED HASH
    const md = forge.md.sha256.create();
    md.update(pdf_hash, "utf8");

    const isValid = publicKey.verify(
      md.digest().bytes(),
      forge.util.decode64(signature)
    );

    res.json({
      valid: isValid,
      signedBy: result.rows[0].signer_email,
      publicKeyFingerprint: forge.md.sha256
        .create()
        .update(public_key)
        .digest()
        .toHex(),
      message: isValid
        ? `✅ Signed by ${result.rows[0].signer_email}`
        : "❌ PDF has been TAMPERED with"
    });


  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Verification failed" });
  }
});

router.post("/esign/signers", async (req, res) => {
  try {
    const { pdfId } = req.body;

    const result = await pool.query(
      `
      SELECT
        signer_email,
        signed_at
      FROM pdf_signatures
      WHERE pdf_id = $1
      ORDER BY signed_at ASC
      `,
      [pdfId]
    );

    if (result.rows.length === 0) {
      return res.json({
        message: "No one has signed this document yet",
        signers: []
      });
    }

    res.json({
      pdfId,
      totalSigners: result.rows.length,
      signers: result.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch signers" });
  }
});

export default router;
