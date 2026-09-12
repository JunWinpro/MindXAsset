import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

// Global cache for images to prevent flickering on re-renders
const imageCache = new Map();

const CanvasPreview = forwardRef(({ layers, width = 512, height = 512, transparentBg = false }, ref) => {
  const canvasRef = useRef(null);

  useImperativeHandle(ref, () => ({
    download: (filename = 'mindx-character.png') => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  }));

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      if (imageCache.has(src)) {
        return resolve(imageCache.get(src));
      }
      const img = new Image();
      img.onload = () => {
        imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  };

  useEffect(() => {
    let isActive = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Sort layers by z_index
    const sortedLayers = [...layers].sort((a, b) => (a.z_index || 0) - (b.z_index || 0));

    // Load all images first before clearing canvas to avoid flickering
    const drawLayers = async () => {
      try {
        const loadedImages = [];
        for (const layer of sortedLayers) {
          if (!layer || !layer.src) continue;
          const img = await loadImage(layer.src);
          loadedImages.push(img);
        }

        if (!isActive) return;

        // Clear and draw once all images are ready
        ctx.clearRect(0, 0, width, height);
        ctx.imageSmoothingEnabled = false; // Đảm bảo pixelated khi scale

        for (let i = 0; i < loadedImages.length; i++) {
          const img = loadedImages[i];
          const layerInfo = sortedLayers[i];

          // Calculate scale and center positioning (70% of canvas height)
          const scale = (height * 0.7) / 32;
          const dW = 32 * scale;
          const dH = 32 * scale;
          const dX = (width - dW) / 2;
          const dY = (height - dH) / 2 + (height * 0.1); // Shift down slightly

          // Check if color tinting is needed
          const hasColor = layerInfo.color && layerInfo.color !== '#ffffff' && layerInfo.color.toLowerCase() !== '#fff';

          if (hasColor) {
            // Offscreen canvas for tinting
            const off = document.createElement('canvas');
            off.width = 32;
            off.height = 32;
            const octx = off.getContext('2d');
            
            // 1. Chuyển ảnh gốc sang đen trắng (grayscale) và tăng nhẹ độ sáng/tương phản
            octx.filter = 'grayscale(100%) contrast(1.2) brightness(1.1)';
            octx.drawImage(img, 32, 0, 32, 32, 0, 0, 32, 32);
            octx.filter = 'none';
            
            // 2. Nhuộm màu bằng chế độ Multiply (nhân màu lên nền xám)
            octx.globalCompositeOperation = 'multiply';
            octx.fillStyle = layerInfo.color;
            octx.fillRect(0, 0, 32, 32);
            
            // 3. Cắt lại đúng viền (alpha mask) của ảnh gốc
            octx.globalCompositeOperation = 'destination-in';
            octx.drawImage(img, 32, 0, 32, 32, 0, 0, 32, 32);
            
            // Draw final tinted image to main canvas
            ctx.drawImage(off, 0, 0, 32, 32, dX, dY, dW, dH);
          } else {
            // Draw normally
            ctx.drawImage(
              img,
              32, 0, 32, 32,      // Crop: sX, sY, sW, sH
              dX, dY, dW, dH      // Draw: dX, dY, dW, dH
            );
          }
        }
      } catch (err) {
        console.error('Failed to load layers', err);
      }
    };

    drawLayers();

    return () => {
      isActive = false; // Cleanup to prevent race conditions
    };
  }, [layers, width, height]);

  return (
    <div className={`relative border-4 border-gray-200 rounded-xl shadow-lg flex flex-col items-center justify-center overflow-hidden w-full aspect-square max-w-[380px] transition-colors duration-300 ${transparentBg ? 'bg-transparent' : 'bg-gray-50'}`}>
      {/* Nền bục đứng nhân vật Retro Pixel Art - Chỉ hiện khi KHÔNG bật nền trong suốt */}
      {!transparentBg && (
        <div className="absolute inset-0 z-0 flex flex-col justify-end">
          {/* Bầu trời / background phía trên */}
          <div className="flex-1 bg-gray-100"></div>
          {/* Bờ tường và vạch phân cách */}
          <div className="h-10 bg-gray-200 border-t border-gray-300"></div>
          {/* Sàn đất / bục đứng */}
          <div className="h-14 bg-gray-300 border-t border-gray-400"></div>
        </div>
      )}

      {/* Hiệu ứng nền caro (transparency grid) khi bật nền trong suốt */}
      {transparentBg && (
        <div className="absolute inset-0 z-0 opacity-20" style={{
          backgroundImage: 'conic-gradient(#aaa 25%, white 25%, white 50%, #aaa 50%, #aaa 75%, white 75%, white)',
          backgroundSize: '24px 24px'
        }}></div>
      )}
      
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        className="relative z-10 w-full h-full object-contain drop-shadow-md"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
});

export default CanvasPreview;
