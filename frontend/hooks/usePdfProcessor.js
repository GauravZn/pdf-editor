import { PDFDocument, degrees } from 'pdf-lib'; // import PDFDocument builder and rotation helper from pdf-lib
export const processPdf = async (pdfBuffer, watermarkUrl, settings) => { // export an async function to process a PDF buffer
  const pdfDoc = await PDFDocument.load(pdfBuffer); // load the PDF bytes into a PDFDocument instance
  const pages = pdfDoc.getPages(); // get an array of all pages in the document
  const image = await pdfDoc.embedPng(watermarkUrl); // embed the watermark PNG (data URL) into the PDF

  pages.forEach((page) => { // iterate over each page to draw the watermark
    const { width: pageWidth, height: pageHeight } = page.getSize(); // destructure the page width and height
    const scaleFactor = (pageWidth * settings.scale) / image.width; // compute scale factor so watermark width = pageWidth * settings.scale
    const imgWidth = image.width * scaleFactor; // compute actual image width after scaling
    const imgHeight = image.height * scaleFactor; // compute actual image height after scaling

    const padding = 40; // keep watermark away from physical edge in PDF points
    let x, y; // declare x and y coordinates for image placement

    // Horizontal Position
    if (settings.position.includes('left')) x = padding; // align to left with padding
    else if (settings.position.includes('right')) x = pageWidth - imgWidth - padding; // align to right with padding
    else x = (pageWidth / 2) - (imgWidth / 2); // otherwise center horizontally

    // Vertical Position
    if (settings.position.includes('top')) y = pageHeight - imgHeight - padding; // align to top with padding
    else if (settings.position.includes('bottom')) y = padding; // align to bottom with padding
    else y = (pageHeight / 2) - (imgHeight / 2); // otherwise center vertically

    page.drawImage(image, { // draw the embedded image onto the page
      x, y, // coordinates where image origin (bottom-left) will be placed
      width: imgWidth, // scaled width
      height: imgHeight, // scaled height
      rotate: degrees(settings.rotation), // rotate image by settings.rotation degrees
      opacity: parseFloat(settings.opacity), // apply opacity (pdf-lib expects a number)
    });
  });

  return await pdfDoc.save(); // serialize and return modified PDF bytes as a Uint8Array
};