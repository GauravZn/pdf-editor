export const createWatermarkImage = (text, settings) => { // export a function that creates a watermark image as a data URL
  return new Promise((resolve) => { // return a Promise that resolves with the generated PNG data URL
    const canvas = document.createElement('canvas'); // create an offscreen canvas element
    const ctx = canvas.getContext('2d'); // get the 2D rendering context from the canvas
    
    // High-res for professional quality
    canvas.width = 1500; // set canvas pixel width for high-resolution output
    canvas.height = 800; // set canvas pixel height for high-resolution output

    ctx.clearRect(0, 0, canvas.width, canvas.height); // clear the entire canvas to a blank state
    
    // Style settings from UI
    ctx.fillStyle = settings.color || '#808080'; // set text fill color from settings or fallback
    ctx.font = `bold 120px ${settings.fontFamily}`; // set font weight, size, and family from settings
    ctx.textAlign = 'center'; // horizontally center text when drawing
    ctx.textBaseline = 'middle'; // vertically center text when drawing

    ctx.fillText(text, canvas.width / 2, canvas.height / 2); // draw the watermark text centered on the canvas
    resolve(canvas.toDataURL('image/png')); // convert canvas to PNG data URL and resolve the Promise with it
  });
};