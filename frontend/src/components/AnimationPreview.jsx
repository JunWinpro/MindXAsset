import React, { useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';
import { toast } from 'react-toastify';

export default function AnimationPreview({ imageUrl, frames = [], layoutFormat = 'single' }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(100); // ms per frame
  const [currentFrame, setCurrentFrame] = useState(0);
  
  // Custom Slicer State
  const [cols, setCols] = useState(1);
  const [rows, setRows] = useState(1);

  // If AI provided frames, use them. Otherwise, let user slice manually.
  const isAutoSlice = frames && frames.length > 0;

  useEffect(() => {
    if (isAutoSlice) {
      // Calculate cols and rows from distinct x and y coordinates
      const distinctX = new Set(frames.map(f => f.x));
      const distinctY = new Set(frames.map(f => f.y));
      setCols(distinctX.size);
      setRows(distinctY.size);
    }
  }, [frames, isAutoSlice]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;
    img.onload = () => {
      imageRef.current = img;
      if (!isAutoSlice) {
        // Initial guess if no frames provided
        setCols(1);
        setRows(1);
      }
    };
  }, [imageUrl, isAutoSlice]);

  // Animation Loop
  useEffect(() => {
    if (!isPlaying || !imageRef.current) return;
    
    let totalFrames = isAutoSlice ? frames.length : (cols * rows);
    if (totalFrames <= 1) return;

    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % totalFrames);
    }, speed);

    return () => clearInterval(interval);
  }, [isPlaying, speed, cols, rows, frames, isAutoSlice]);

  // Render Frame to Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;
    
    if (!ctx || !img) return;

    let totalFrames = isAutoSlice ? frames.length : (cols * rows);
    if (totalFrames === 0) return;
    
    let frameX = 0;
    let frameY = 0;
    let frameW = img.width;
    let frameH = img.height;

    if (isAutoSlice) {
      const frameData = frames[currentFrame % frames.length];
      if (frameData) {
        frameX = frameData.x;
        frameY = frameData.y;
        frameW = frameData.w;
        frameH = frameData.h;
      }
    } else {
      frameW = img.width / cols;
      frameH = img.height / rows;
      const col = (currentFrame % totalFrames) % cols;
      const row = Math.floor((currentFrame % totalFrames) / cols);
      frameX = col * frameW;
      frameY = row * frameH;
    }

    canvas.width = frameW;
    canvas.height = frameH;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the specific frame
    ctx.drawImage(img, frameX, frameY, frameW, frameH, 0, 0, frameW, frameH);
  }, [currentFrame, cols, rows, frames, isAutoSlice, imageUrl]);

  const handleDownloadZip = async () => {
    const img = imageRef.current;
    if (!img) return;

    const zip = new JSZip();
    let totalFrames = isAutoSlice ? frames.length : (cols * rows);
    
    // Create a temporary canvas for slicing
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    let count = 0;
    for (let i = 0; i < totalFrames; i++) {
      let frameX = 0, frameY = 0, frameW = img.width, frameH = img.height;
      
      if (isAutoSlice) {
        const frameData = frames[i];
        frameX = frameData.x;
        frameY = frameData.y;
        frameW = frameData.w;
        frameH = frameData.h;
      } else {
        frameW = img.width / cols;
        frameH = img.height / rows;
        const col = i % cols;
        const row = Math.floor(i / cols);
        frameX = col * frameW;
        frameY = row * frameH;
      }

      tempCanvas.width = frameW;
      tempCanvas.height = frameH;
      tempCtx.clearRect(0, 0, frameW, frameH);
      tempCtx.drawImage(img, frameX, frameY, frameW, frameH, 0, 0, frameW, frameH);

      const dataUrl = tempCanvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1];
      zip.file(`frame_${i.toString().padStart(2, '0')}.png`, base64Data, { base64: true });
      count++;
    }

    toast.info('Đang nén file ZIP...');
    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mindx_spritesheet_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Đã tải xuống ${count} frames thành công!`);
    } catch (err) {
      toast.error('Lỗi khi tạo file ZIP!');
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-4 mt-4">
      <div className="flex items-center justify-between border-b pb-2 border-gray-200">
        <h3 className="font-semibold text-gray-700 text-sm">Animation Preview & Slicer</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-md transition font-semibold"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
      </div>

      <div className="flex justify-center items-center bg-[url('https://t3.ftcdn.net/jpg/03/76/74/78/360_F_376747823_L8il80K6cKQcbGAEHTk2vwE4h3sJ7m2l.jpg')] bg-repeat rounded-lg border border-gray-300 overflow-hidden relative min-h-[128px]">
        <canvas ref={canvasRef} className="max-w-full max-h-48 object-contain" style={{ imageRendering: 'pixelated' }} />
      </div>

      <div className="flex flex-col gap-3 text-sm text-gray-700">
        <div className="flex items-center gap-3">
          <label className="w-20 font-medium">Tốc độ:</label>
          <input 
            type="range" 
            min="20" 
            max="500" 
            value={speed} 
            onChange={(e) => setSpeed(parseInt(e.target.value))} 
            className="flex-1 accent-red-600"
          />
          <span className="w-16 text-right text-xs font-semibold">{speed}ms</span>
        </div>

        {!isAutoSlice && (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <label className="font-medium">Số cột:</label>
              <input 
                type="number" 
                min="1" 
                value={cols} 
                onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))} 
                className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 outline-none focus:border-red-500 transition"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="font-medium">Số dòng:</label>
              <input 
                type="number" 
                min="1" 
                value={rows} 
                onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))} 
                className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 outline-none focus:border-red-500 transition"
              />
            </div>
          </div>
        )}

        <button 
          onClick={handleDownloadZip}
          className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          Cắt & Tải File ZIP ({isAutoSlice ? frames.length : (cols * rows)} frames)
        </button>
      </div>
    </div>
  );
}
