import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';

export const processPdf = async (pdfBuffer, watermarkUrl, settings) => {

  // Loading the PDF bytes into a PDFDocument instance
  const pdfDoc = await PDFDocument.load(pdfBuffer); 

  // Get an array of all pages in the document
  const pages = pdfDoc.getPages();
  
  // embed the watermark PNG (data URL) into the PDF
  const image = await pdfDoc.embedPng(watermarkUrl); 

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  pages.forEach((page) => { 

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

      x, y, 
      width: imgWidth,
      height: imgHeight,
      rotate: degrees(settings.rotation),
      opacity: parseFloat(settings.opacity), // apply opacity, pdf-lib expects a number
    });


    if (settings.flatten) {

      // Function for ultra-short, disruptive junk
      const getTinyJunk = () => {
        const chars = 'xo!$@.</z>!^%^z1mio#'; 
        return chars[Math.floor(Math.random() * chars.length)];
      };

      for (let y = 2; y < pageHeight; y += 6) {

        // Offset every other line to create a web of junk
        const offsetX = (y % 12 === 0) ? 0 : 15;

        // A 25px step is narrower than the average 5-letter word
        for (let x = offsetX; x < pageWidth; x += 25) {
          page.drawText(getTinyJunk(), {
            x: x + (Math.random() * 10), // Add "jitter" so it's not a perfect grid
            y: y,
            size: 4 + Math.random() * 3, // Tiny, but big enough to be captured
            font: font,
            color: rgb(1, 1, 1),
            opacity: 0.001, 
          });
        }
      }
    }
  });

  return await pdfDoc.save();
};