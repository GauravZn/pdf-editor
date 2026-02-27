import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateSignedPdfBuffer = async (existingPdfPath, signers, envelopeId) => {
    try {
        console.log("-> Starting PDF Generation...");
        const absolutePath = path.resolve(existingPdfPath);
        const existingPdfBytes = fs.readFileSync(absolutePath);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        pdfDoc.registerFontkit(fontkit);
        const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        const pages = pdfDoc.getPages();
        const SCALE = 1.2;

        for (const signer of signers) {
            if (signer.status === 'completed' && signer.fields) {
                for (const field of signer.fields) {
                    if (!field.value) continue;

                    const pageIndex = (field.page || 1) - 1;
                    if (pageIndex >= pages.length) continue;
                    
                    const page = pages[pageIndex];
                    const { height } = page.getSize();

                    const pdfX = (field.x || 0) / SCALE;
                    const fieldHeightPdf = (field.height || 40) / SCALE;
                    const fieldWidthPdf = (field.width || 140) / SCALE;
                    const pdfY = height - ((field.y || 0) / SCALE) - fieldHeightPdf;
                    
                    try {
                        // 🔥 With the frontend update, ALL signatures arrive as perfectly rendered Images
                        if (String(field.value).startsWith('data:image')) {
                            const imgData = field.value.split(',')[1];
                            const imgBuffer = Buffer.from(imgData, 'base64');
                            const img = field.value.includes('image/png') 
                                ? await pdfDoc.embedPng(imgBuffer) 
                                : await pdfDoc.embedJpg(imgBuffer);
                            
                            const imgDims = img.scale(1);
                            
                            // Perfect aspect ratio scaling
                            const scaleFactor = Math.min(
                                fieldWidthPdf / imgDims.width, 
                                fieldHeightPdf / imgDims.height
                            );
                            
                            const finalWidth = imgDims.width * scaleFactor;
                            const finalHeight = imgDims.height * scaleFactor;
                            
                            // Perfect centering
                            const centerX = pdfX + (fieldWidthPdf - finalWidth) / 2;
                            const centerY = pdfY + (fieldHeightPdf - finalHeight) / 2;

                            page.drawImage(img, { x: centerX, y: centerY, width: finalWidth, height: finalHeight });

                        } else {
                            // Standard Text Fallback (for non-signature text fields)
                            let textColor = rgb(0, 0, 0);
                            if (field.color === '#000080') textColor = rgb(0, 0, 0.5);
                            else if (field.color === '#2563eb') textColor = rgb(0.14, 0.38, 0.92);
                            else if (field.color === '#1e293b') textColor = rgb(0.11, 0.16, 0.23);

                            const textToDraw = String(field.value).trim();
                            let fontSize = 12;
                            let textWidth = standardFont.widthOfTextAtSize(textToDraw, fontSize);
                            
                            while (textWidth > fieldWidthPdf - 6 && fontSize > 6) {
                                fontSize -= 1;
                                textWidth = standardFont.widthOfTextAtSize(textToDraw, fontSize);
                            }
                            
                            const textX = pdfX + (fieldWidthPdf - textWidth) / 2;
                            const textY = pdfY + (fieldHeightPdf / 2) - (fontSize / 3);

                            page.drawText(textToDraw, {
                                x: Math.max(pdfX, textX), 
                                y: textY,
                                size: fontSize,
                                font: standardFont,
                                color: textColor,
                            });
                        }
                    } catch (err) { 
                        console.error("Field draw error:", err.message); 
                    }
                }
            }
        }

        return await pdfDoc.save();
    } catch (error) {
        console.error("🔥 FATAL GENERATION ERROR:", error);
        throw error;
    }
};