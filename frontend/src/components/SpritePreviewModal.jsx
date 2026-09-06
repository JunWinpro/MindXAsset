import { useState, useEffect, useRef } from 'react';

const SpritePreviewModal = ({ isOpen, imageUrl, metadata, onClose }) => {
  const [columns, setColumns] = useState(metadata?.columns || 1);
  const [rows, setRows] = useState(metadata?.rows || 1);
  const [prevMetadata, setPrevMetadata] = useState(metadata);
  const [fps, setFps] = useState(10);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);
  
  const BACKGROUNDS = [
    { id: 'transparent', name: 'Trong suốt (Caro)', value: 'url("https://www.transparenttextures.com/patterns/cubes.png")', className: 'bg-gray-200' },
    { id: 'black', name: 'Nền đen', value: 'none', className: 'bg-black' },
    { id: 'white', name: 'Nền trắng', value: 'none', className: 'bg-white' },
    { id: 'green', name: 'Màn hình xanh', value: 'none', className: 'bg-[#00b140]' },
    { id: 'forest', name: 'Khu rừng', value: 'url("https://img.freepik.com/free-vector/pixel-art-rural-landscape_24908-61882.jpg")', className: 'bg-cover bg-center' },
  ];
  const [previewBg, setPreviewBg] = useState(BACKGROUNDS[0]);

  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);

  if (metadata !== prevMetadata) {
    setPrevMetadata(metadata);
    if (metadata?.columns) setColumns(metadata.columns);
    if (metadata?.rows) setRows(metadata.rows);
  }

  useEffect(() => {
    if (imageUrl) {
      const img = new Image();
      img.onload = () => {
        setImgSize({ width: img.width, height: img.height });
      };
      img.src = imageUrl;
    }
  }, [imageUrl]);

  useEffect(() => {
    let interval;
    if (isPlaying && columns * rows > 1) {
      interval = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % (columns * rows));
      }, 1000 / fps);
    }
    return () => clearInterval(interval);
  }, [isPlaying, columns, rows, fps]);

  const frameWidth = imgSize.width / columns || 0;
  const frameHeight = imgSize.height / rows || 0;
  
  const bgPositionX = -((currentFrame % columns) * frameWidth);
  const bgPositionY = -(Math.floor(currentFrame / columns) * frameHeight);

  // Generate grid cells for overlay
  const gridCells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      gridCells.push(
        <div 
          key={`${r}-${c}`} 
          className="border border-red-500/50 box-border"
          style={{ width: `${100/columns}%`, height: `${100/rows}%` }}
        />
      );
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 lg:p-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-full flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Cắt Thủ Công & Preview Animation</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
          
          {/* Left Panel: Slicing */}
          <div className="w-full lg:w-1/2 p-6 flex flex-col gap-6">
            <h3 className="font-semibold text-lg text-gray-700 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm">1</span>
              Cấu hình lưới cắt (Grid)
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Số cột ngang (Columns)</label>
                <input 
                  type="number" min="1" max="64"
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-red-500 outline-none"
                  value={columns} onChange={e => setColumns(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Số hàng dọc (Rows)</label>
                <input 
                  type="number" min="1" max="64"
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-red-500 outline-none"
                  value={rows} onChange={e => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            </div>

            <div className="flex-1 bg-gray-100 rounded-xl border border-gray-200 p-4 flex flex-col items-center justify-center min-h-[300px] overflow-auto">
              <div className="relative inline-block" ref={containerRef}>
                <img src={imageUrl} alt="Original Sprite" className="max-w-full max-h-[400px] object-contain block" style={{ imageRendering: 'pixelated' }} />
                {/* Grid Overlay */}
                <div className="absolute inset-0 flex flex-wrap pointer-events-none">
                  {gridCells}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">Kích thước 1 khung: {Math.round(frameWidth)} x {Math.round(frameHeight)} px</p>
            </div>
          </div>

          {/* Right Panel: Preview */}
          <div className="w-full lg:w-1/2 p-6 flex flex-col gap-6">
            <h3 className="font-semibold text-lg text-gray-700 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm">2</span>
              Xem trước hoạt ảnh (Preview)
            </h3>

            {/* Background Selector */}
            <div className="flex gap-2 overflow-x-auto pb-1 items-center">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap mr-1">Nền:</span>
              {BACKGROUNDS.map(bg => (
                <button
                  key={bg.id}
                  onClick={() => setPreviewBg(bg)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${previewBg.id === bg.id ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'} transition-all whitespace-nowrap`}
                >
                  {bg.name}
                </button>
              ))}
            </div>

            <div 
              className={`flex-1 rounded-xl border-2 border-gray-300 p-4 flex flex-col items-center justify-center min-h-[300px] shadow-inner overflow-hidden relative ${previewBg.className}`}
              style={{ backgroundImage: previewBg.value }}
            >
              {imgSize.width > 0 && columns > 0 && rows > 0 ? (
                <div 
                  className="overflow-hidden relative z-10"
                  style={{ 
                    width: `${frameWidth}px`, 
                    height: `${frameHeight}px`,
                    maxWidth: '100%',
                    maxHeight: '400px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'transparent'
                  }}
                >
                  <div 
                    style={{
                      width: `${imgSize.width}px`,
                      height: `${imgSize.height}px`,
                      backgroundImage: `url(${imageUrl})`,
                      backgroundPosition: `${bgPositionX}px ${bgPositionY}px`,
                      backgroundSize: `${imgSize.width}px ${imgSize.height}px`,
                      backgroundRepeat: 'no-repeat',
                      imageRendering: 'pixelated',
                      transformOrigin: 'top left',
                      transform: frameWidth > 400 || frameHeight > 400 ? `scale(${Math.min(400/frameWidth, 400/frameHeight)})` : 'scale(1)'
                    }}
                  />
                </div>
              ) : (
                <p className="text-gray-500 relative z-10">Đang tải...</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Tốc độ (FPS): {fps}</span>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-4 py-2 rounded-lg font-bold text-white transition-colors ${isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600'}`}
                >
                  {isPlaying ? 'Tạm dừng (Pause)' : 'Phát (Play)'}
                </button>
              </div>
              <input 
                type="range" min="1" max="60" value={fps} onChange={(e) => setFps(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              <p className="text-xs text-gray-500 text-center">Điều chỉnh thanh trượt để xem độ mượt của hoạt ảnh.</p>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-medium transition-colors">
            Đóng cửa sổ
          </button>
        </div>

      </div>
    </div>
  );
};

export default SpritePreviewModal;