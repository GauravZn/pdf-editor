import express from "express";
import multer from "multer";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

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

export default router;
