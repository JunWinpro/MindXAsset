import { useEffect, useRef, useState, useMemo } from 'react';
import JSZip from 'jszip';
import { toast } from 'react-toastify';

export default function AnimationPreview({ imageUrl, frames = [], layoutFormat = 'single' }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const bgInputRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(100); // ms per frame
  const [currentFrame, setCurrentFrame] = useState(0);
  
  // Custom Manual Slicer State
  const [manualCols, setManualCols] = useState(1);
  const [manualRows, setManualRows] = useState(1);

  // ── Built-in safe backgrounds (no external Freepik URLs) ──
  const BACKGROUNDS = [
    { id: 'transparent', name: 'Trong suốt (Caro)', style: {}, className: 'bg-gray-200 bg-[length:16px_16px] bg-[linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%,#ccc),linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%,#ccc)] bg-[position:0_0,8px_8px]' },
    { id: 'black', name: 'Nền đen', style: {}, className: 'bg-black' },
    { id: 'white', name: 'Nền trắng', style: {}, className: 'bg-white border-gray-300' },
    { id: 'green', name: 'Màn hình xanh', style: {}, className: 'bg-[#00b140]' },
  ];

  const [previewBg, setPreviewBg] = useState(BACKGROUNDS[0]);
  const [customBgUrl, setCustomBgUrl] = useState(null);
  const [useCustomBg, setUseCustomBg] = useState(false);

  // If AI provided frames, use them. Otherwise, let user slice manually.
  const isAutoSlice = Array.isArray(frames) && frames.length > 0;

  const autoCols = useMemo(() => {
    if (isAutoSlice) {
      const distinctX = new Set(frames.map(f => f.x));
      return distinctX.size || 1;
    }
    return 1;
  }, [frames, isAutoSlice]);

  const autoRows = useMemo(() => {
    if (isAutoSlice) {
      const distinctY = new Set(frames.map(f => f.y));
      return distinctY.size || 1;
    }
    return 1;
  }, [frames, isAutoSlice]);

  const cols = isAutoSlice ? autoCols : manualCols;
  const rows = isAutoSlice ? autoRows : manualRows;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;
    img.onload = () => {
      imageRef.current = img;
    };
  }, [imageUrl]);

  // Animation Loop
  useEffect(() => {
    if (!isPlaying || !imageRef.current) return;
    
    const totalFrames = isAutoSlice ? frames.length : (cols * rows);
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

    const totalFrames = isAutoSlice ? frames.length : (cols * rows);
    if (totalFrames === 0) return;
    
    let frameX;
    let frameY;
    let frameW;
    let frameH;

    if (isAutoSlice) {
      const frameData = frames[currentFrame % frames.length];
      if (frameData) {
        frameX = frameData.x;
        frameY = frameData.y;
        frameW = frameData.w;
        frameH = frameData.h;
      } else {
        frameX = 0;
        frameY = 0;
        frameW = img.width;
        frameH = img.height;
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

  // ── User uploads their own background ──
  const handleBgUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh nền hợp lệ.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomBgUrl(reader.result);
        setUseCustomBg(true);
        setPreviewBg(null);
        toast.success('Đã tải nền tùy chỉnh!');
      };
      reader.readAsDataURL(file);
    }
  };

  const selectBuiltinBg = (bg) => {
    setPreviewBg(bg);
    setUseCustomBg(false);
  };

  const clearCustomBg = () => {
    setCustomBgUrl(null);
    setUseCustomBg(false);
    setPreviewBg(BACKGROUNDS[0]);
    if (bgInputRef.current) bgInputRef.current.value = '';
  };

  // ── Compute background className + style for the preview container ──
  const bgClassName = useCustomBg ? 'bg-cover bg-center bg-no-repeat' : (previewBg?.className || '');
  const bgStyle = useCustomBg && customBgUrl ? { backgroundImage: `url("${customBgUrl}")` } : {};

  const handleDownloadZip = async () => {
    const img = imageRef.current;
    if (!img) return;

    const zip = new JSZip();
    const totalFrames = isAutoSlice ? frames.length : (cols * rows);
    
    // Create a temporary canvas for slicing
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    let count = 0;
    for (let i = 0; i < totalFrames; i++) {
      let frameX;
      let frameY;
      let frameW;
      let frameH;
      
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
    } catch {
      toast.error('Lỗi khi tạo file ZIP!');
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-4 mt-4">
      <div className="flex items-center justify-between border-b pb-2 border-gray-200">
        <h3 className="font-semibold text-gray-700 text-sm">
          Animation Preview & Slicer ({layoutFormat === 'grid' ? 'Lưới Grid' : 'Dải Ngang'})
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-md transition font-semibold"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
      </div>

      {/* ── Background Selector ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 items-center flex-wrap">
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap mr-1">Nền:</span>
        {BACKGROUNDS.map(bg => (
          <button
            key={bg.id}
            onClick={() => selectBuiltinBg(bg)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap ${
              !useCustomBg && previewBg?.id === bg.id 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {bg.name}
          </button>
        ))}
        
        {/* ── Upload custom background ── */}
        <button
          onClick={() => bgInputRef.current?.click()}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap flex items-center gap-1 ${
            useCustomBg 
              ? 'border-blue-500 bg-blue-50 text-blue-700' 
              : 'border-dashed border-gray-300 bg-white text-gray-500 hover:border-blue-400 hover:text-blue-600'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          {useCustomBg ? 'Đã tải nền' : 'Tải nền của bạn'}
        </button>
        <input 
          ref={bgInputRef}
          type="file" 
          accept="image/*" 
          onChange={handleBgUpload} 
          className="hidden" 
        />

        {useCustomBg && (
          <button
            onClick={clearCustomBg}
            className="px-2 py-1.5 rounded-lg text-xs font-medium border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all whitespace-nowrap"
            title="Xóa nền tùy chỉnh"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Canvas preview ── */}
      <div 
        className={`flex justify-center items-center rounded-lg border border-gray-300 overflow-hidden relative min-h-[128px] ${bgClassName}`}
        style={bgStyle}
      >
        <canvas ref={canvasRef} className="max-w-full max-h-48 object-contain relative z-10" style={{ imageRendering: 'pixelated' }} />
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
                value={manualCols} 
                onChange={(e) => setManualCols(Math.max(1, parseInt(e.target.value) || 1))} 
                className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 outline-none focus:border-blue-500 transition"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="font-medium">Số dòng:</label>
              <input 
                type="number" 
                min="1" 
                value={manualRows} 
                onChange={(e) => setManualRows(Math.max(1, parseInt(e.target.value) || 1))} 
                className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 outline-none focus:border-blue-500 transition"
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
