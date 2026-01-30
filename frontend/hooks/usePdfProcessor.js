import { PDFDocument, degrees } from 'pdf-lib';
export const processPdf = async (pdfBuffer, watermarkUrl, settings) => {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const image = await pdfDoc.embedPng(watermarkUrl);

  pages.forEach((page) => {
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const scaleFactor = (pageWidth * settings.scale) / image.width;
    const imgWidth = image.width * scaleFactor;
    const imgHeight = image.height * scaleFactor;

    const padding = 40; // Keeps watermark away from the physical edge
    let x, y;

    // Horizontal Position
    if (settings.position.includes('left')) x = padding;
    else if (settings.position.includes('right')) x = pageWidth - imgWidth - padding;
    else x = (pageWidth / 2) - (imgWidth / 2); // Center

    // Vertical Position
    if (settings.position.includes('top')) y = pageHeight - imgHeight - padding;
    else if (settings.position.includes('bottom')) y = padding;
    else y = (pageHeight / 2) - (imgHeight / 2); // Center

    page.drawImage(image, {
      x, y,
      width: imgWidth,
      height: imgHeight,
      rotate: degrees(settings.rotation),
      opacity: parseFloat(settings.opacity),
    });
  });

  return await pdfDoc.save();
};