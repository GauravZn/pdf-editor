export const createWatermarkImage = (text, settings) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // High-res for professional quality
    canvas.width = 1500;
    canvas.height = 800;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Style settings from UI
    ctx.fillStyle = settings.color || '#ef4444'; 
    ctx.font = `bold 120px ${settings.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    resolve(canvas.toDataURL('image/png'));
  });
};

//here