import { PDFDocument, degrees, rgb } from 'pdf-lib';


export const processPdf = async (pdfBuffer, watermarkUrl, settings) => { 

  const pdfDoc = await PDFDocument.load(pdfBuffer); // load the PDF bytes into a PDFDocument instance
  const pages = pdfDoc.getPages(); // get an array of all pages in the document
  const image = await pdfDoc.embedPng(watermarkUrl); // embed the watermark PNG (data URL) into the PDF

  pages.forEach((page) => { // iterate over each page to draw the watermark

    const { width: pageWidth, height: pageHeight } = page.getSize();
    const scaleFactor = (pageWidth * settings.scale) / image.width;
    const imgWidth = image.width * scaleFactor; 
    const imgHeight = image.height * scaleFactor; 

    const padding = 20; // keep watermark away from physical edge in PDF points
    let x, y; // declare x and y coordinates for image placement


    // it takes the distances relative to bottom-left corner.
    // Horizontal Position
    if (settings.position.includes('left')) x = padding; // align to left with padding
    else if (settings.position.includes('right')) x = pageWidth - imgWidth - padding; // align to right with padding
    else x = (pageWidth / 2) - (imgWidth / 2); // otherwise center horizontally

    // Vertical Position
    if (settings.position.includes('top')) y = pageHeight - imgHeight - padding; // align to top with padding
    else if (settings.position.includes('bottom')) y = padding; // align to bottom with padding
    else y = (pageHeight / 2) - (imgHeight / 2); // otherwise center vertically

    // draw the embedded image onto the page

    page.drawImage(image, { 
      x, y, // coordinates where image origin (bottom-left) will be placed
      width: imgWidth, 
      height: imgHeight,
      rotate: degrees(settings.rotation), // rotate image by settings.rotation degrees
      opacity: parseFloat(settings.opacity), // apply opacity (pdf-lib expects a number)
    });

    // 2. THE HUMANE FLATTEN: The "Invisible Shield"
    if (settings.flatten) {
      page.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        color: rgb(0,0,0), // Using a "color" instead of just opacity (RGB values for #010101)
        opacity: 0.01,
        borderWidth: 0,
      });
      console.log("Flatten applied: Invisible shield added.");
    }
  });

  return await pdfDoc.save(); 
};