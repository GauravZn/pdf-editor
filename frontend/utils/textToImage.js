
export const createWatermarkImage = (text, settings) => { 

  return new Promise((resolve) => { 

    const canvas = document.createElement('canvas'); // create an offscreen canvas element
    const ctx = canvas.getContext('2d'); // get the 2D rendering context from the canvas
    
    // High-res for professional quality
    canvas.width = settings.scale*65*text.length; // set canvas pixel width for high-resolution output
    // canvas.width = 500; // set canvas pixel width for high-resolution output
    canvas.height = settings.scale*70; // set canvas pixel height for high-resolution output
    // canvas.height = 400; // set canvas pixel height for high-resolution output


    // clear the entire canvas to a blank state
    // x, y, width, height
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    
// 2. DRAW THE BOUNDARY (BORDER)
ctx.strokeStyle = settings.color || '#808080'; // Use text color for border
ctx.lineWidth = 5; // Set thickness of the boundary
// Draw rectangle at (0,0) with full width/height
ctx.strokeRect(0, 0, canvas.width, canvas.height); 

    // Style settings from UI
    ctx.fillStyle = settings.color || '#808080'; // set text fill color from settings or fallback
    ctx.font = `bold ${settings.scale*100}px ${settings.fontFamily}`; // set font weight, size, and family from settings
    ctx.textAlign = 'center'; // horizontally center text when drawing
    ctx.textBaseline = 'middle'; // vertically center text when drawing

    ctx.fillText(text, canvas.width / 2, canvas.height / 2); // draw the watermark text centered on the canvas
    console.log('new image generated')
    resolve(canvas.toDataURL('image/png')); // convert canvas to PNG data URL and resolve the Promise with it
  });
};