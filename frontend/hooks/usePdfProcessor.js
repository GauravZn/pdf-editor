import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
export const processPdf = async (pdfBuffer, watermarkUrl, settings, text) => {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const image = await pdfDoc.embedPng(watermarkUrl);

  pages.forEach((page) => {
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const imgWidth = settings.scale * 65 * text.length;
    const imgHeight = settings.scale * 70;
    const rotationRad = (settings.rotation * Math.PI) / 180;
    
    let centerX = settings.position.includes('left') ? 10 + (imgWidth / 2) 
                : settings.position.includes('right') ? pageWidth - 10 - (imgWidth / 2) 
                : pageWidth / 2;
    let centerY = settings.position.includes('top') ? pageHeight - 10 - (imgHeight / 2) 
                : settings.position.includes('bottom') ? 10 + (imgHeight / 2) 
                : pageHeight / 2;

    // 1. Draw the image (this creates a new content stream at the end)
    page.drawImage(image, {
      x: centerX - (imgWidth / 2) * Math.cos(rotationRad) + (imgHeight / 2) * Math.sin(rotationRad),
      y: centerY - (imgWidth / 2) * Math.sin(rotationRad) - (imgHeight / 2) * Math.cos(rotationRad),
      width: imgWidth,
      height: imgHeight,
      rotate: degrees(settings.rotation),
      opacity: parseFloat(settings.opacity),
    });

    // 2. REORDER MANUALLY (The "Save the Rating" Logic)
    // We access the raw 'Contents' entry of the page node
    const contents = page.node.get(pdfDoc.context.obj('Contents'));
    
    // Check if it's an array (standard for pages with multiple streams)
    if (contents instanceof Array || (contents && contents.array)) {
      const array = contents instanceof Array ? contents : contents.array;
      if (array.length > 1) {
        // Pop the watermark stream we just added to the end
        const watermarkStream = array.pop();
        // Insert it at index 0 (the bottom layer)
        array.unshift(watermarkStream);
      }
    }
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

  return await pdfDoc.save();
};

