import { useState, useRef } from 'react';
import SpritePreviewModal from '../components/SpritePreviewModal';
import AnimationPreview from '../components/AnimationPreview';
import { toast } from 'react-toastify';

/* ── Helper: format seconds → "Xm Ys" ── */
const formatDuration = (totalSeconds) => {
  const t = parseFloat(totalSeconds);
  if (isNaN(t) || t <= 0) return '0s';
  if (t < 60) return `${Math.round(t)}s`;
  const m = Math.floor(t / 60);
  const s = Math.round(t % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

/* ── Asset types that are image-upload based ── */
const IMAGE_UPLOAD_TYPES = ['sprite-from-image', 'pixel-from-image'];
/* ── Asset types where Style & Perspective are irrelevant ── */
const HIDE_STYLE_PERSPECTIVE_TYPES = ['pixel', 'pixel-from-image', 'sprite-from-image'];

const Generator = () => {
  const [prompt, setPrompt] = useState('');
  const [assetType, setAssetType] = useState('character');
  const [artStyle, setArtStyle] = useState('Pixel Art');
  const [perspective, setPerspective] = useState('Isometric');
  const [ratio, setRatio] = useState('1:1');
  const [customWidth, setCustomWidth] = useState(512);
  const [customHeight, setCustomHeight] = useState(512);

  // Background specific
  const [timeOfDay, setTimeOfDay] = useState('day');
  
  // Tilesheet specific
  const [action, setAction] = useState('running');
  const [frames, setFrames] = useState(10);

  // Tileset specific
  const [tiles, setTiles] = useState('');
  const [columns, setColumns] = useState(8);
  const [cellSize, setCellSize] = useState('64x64');

  // Pixel/From Image specific
  const [blockSize, setBlockSize] = useState(8);
  const [colors, setColors] = useState(32);
  const [extraPrompt, setExtraPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [imageResult, setImageResult] = useState(null);
  const [generationTime, setGenerationTime] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Drag-and-drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  /* ── Derived: auto-calc tileset width ── */
  const getCellSizePx = () => parseInt(cellSize.split('x')[0], 10) || 64;
  const tilesetAutoWidth = columns * getCellSizePx();

  const handleAssetTypeChange = (newType) => {
    setAssetType(newType);
    setImageResult(null);
    setMetadata(null);
  };

  /* ── Image Upload (file input + drag-drop) ── */
  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn một file ảnh hợp lệ (JPG, PNG, WEBP).');
      return;
    }
    setUploadedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Generate handler ── */
  const handleGenerate = async () => {
    if (!IMAGE_UPLOAD_TYPES.includes(assetType) && !prompt.trim() && !tiles.trim()) {
      toast.error('Vui lòng nhập mô tả ý tưởng của bạn!');
      return;
    }
    if (IMAGE_UPLOAD_TYPES.includes(assetType) && !uploadedImage) {
      toast.error('Vui lòng tải lên một ảnh tham chiếu!');
      return;
    }

    setIsGenerating(true);
    setImageResult(null);
    setMetadata(null);
    
    const startTime = Date.now();

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://mindxasset.onrender.com');
      let endpoint = '';
      let bodyData = null;
      let formData = null;

      // Smart Mapping Size
      let size_key = ratio === '1:1' ? '64x64' : (ratio === '16:9' ? '128x128' : '32x32');
      if (assetType === 'background') {
        size_key = ratio === '1:1' ? 'background_sq' : (ratio === '16:9' ? 'background_hd' : 'background_sd');
      }
      if (ratio === 'custom') {
        size_key = `${customWidth}x${customHeight}`;
      }

      if (assetType === 'background') {
        endpoint = `${baseUrl}/api/generate-background`;
        bodyData = { subject: prompt, size_key, style: artStyle, time_of_day: timeOfDay, seed: -1 };
      } else if (assetType === 'tilesheet') {
        endpoint = `${baseUrl}/api/generate-tilesheet`;
        bodyData = { subject: prompt, action, frames, style: artStyle, perspective, seed: -1 };
      } else if (assetType === 'tileset') {
        endpoint = `${baseUrl}/api/generate-tileset`;
        bodyData = { subject: prompt || tiles, size_key: cellSize, columns, style: artStyle, perspective, seed: -1 };
      } else if (IMAGE_UPLOAD_TYPES.includes(assetType)) {
        endpoint = `${baseUrl}/api/generate-from-image`;
        formData = new FormData();
        formData.append('subject', extraPrompt);
        formData.append('command', assetType);
        formData.append('style', artStyle);
        formData.append('size_key', size_key);
        if (assetType === 'pixel-from-image') {
          formData.append('block', blockSize);
          formData.append('colors', colors);
        }
        formData.append('image', uploadedImage);
        bodyData = formData;
      } else {
        endpoint = `${baseUrl}/api/generate-sprite`;
        let finalPrompt = prompt;
        let styleToSend = artStyle;
        if (assetType === 'pixel') {
          styleToSend = 'Pixel Art';
          finalPrompt += `, color palette: ${colors} colors limited, block size ${blockSize}`;
        }
        bodyData = { subject: finalPrompt, size_key, style: styleToSend, perspective, seed: -1 };
      }

      let response;
      if (bodyData instanceof FormData) {
        response = await fetch(endpoint, { method: 'POST', body: bodyData });
      } else {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Đã có lỗi xảy ra từ máy chủ.');
      }

      setImageResult(data.image || `${baseUrl}/${data.file_path}`);
      if (data.metadata) setMetadata(data.metadata);
      
      const timeTaken = ((Date.now() - startTime) / 1000).toFixed(1);
      setGenerationTime(timeTaken);
      toast.success('Tạo Asset thành công!');
    } catch (err) {
      toast.error(err.message || 'Lỗi khi tạo asset.');
    } finally {
      setIsGenerating(false);
    }
  };

  /* ── Derived flags ── */
  const showStyleAndPerspective = !HIDE_STYLE_PERSPECTIVE_TYPES.includes(assetType);
  const showUpload = IMAGE_UPLOAD_TYPES.includes(assetType);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* ═══════════ LEFT PANEL: Cấu hình ═══════════ */}
      <div className="lg:col-span-4 flex flex-col gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="pb-2 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Cấu hình Asset</h2>
          <p className="text-sm text-gray-500">Lựa chọn thông số để tạo hình ảnh</p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Loại Asset */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Loại Asset</label>
            <select className="w-full rounded-xl bg-gray-50 border border-gray-300 text-gray-900 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" value={assetType} onChange={(e) => handleAssetTypeChange(e.target.value)}>
              <option value="character">Nhân vật / Sprite</option>
              <option value="background">Cảnh quan / Background</option>
              <option value="tilesheet">Hoạt ảnh / Tilesheet</option>
              <option value="tileset">Gạch môi trường / Tileset</option>
              <option value="pixel">Ép chữ thành Pixel</option>
              <option value="sprite-from-image">Từ ảnh {'→'} Sprite</option>
              <option value="pixel-from-image">Từ ảnh {'→'} Pixel Art</option>
            </select>
          </div>

          {/* ── Upload ảnh (Drag & Drop) ── */}
          {showUpload && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Tải ảnh lên (Bắt buộc)</label>
              {!imagePreviewUrl ? (
                <div
                  className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all ${
                    isDragging 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-500 text-center">
                    <span className="font-semibold text-blue-600">Nhấn để chọn</span> hoặc kéo thả ảnh vào đây
                  </p>
                  <p className="text-xs text-gray-400">JPG, PNG, WEBP — Tối đa 10MB</p>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                  />
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={imagePreviewUrl} alt="Preview" className="w-full max-h-48 object-contain" />
                  <button 
                    onClick={clearUploadedImage}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg transition-colors"
                    title="Xóa ảnh"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="px-3 py-2 bg-white border-t border-gray-100 text-xs text-gray-500 truncate">
                    {uploadedImage?.name}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Phong cách (chỉ hiển thị khi phù hợp) ── */}
          {showStyleAndPerspective && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Phong cách (Smart Mapped)</label>
              <select className="w-full rounded-xl bg-gray-50 border border-gray-300 text-gray-900 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" value={artStyle} onChange={(e) => setArtStyle(e.target.value)}>
                <option value="Pixel Art">Pixel Art</option>
                <option value="Cartoon">Cartoon / Anime</option>
                <option value="Realistic">Realistic / 3D Render</option>
                <option value="Chibi">Chibi</option>
                <option value="Voxel">Voxel 3D</option>
                <option value="Cyberpunk">Cyberpunk</option>
              </select>
            </div>
          )}

          {/* ── Góc nhìn (chỉ hiển thị khi phù hợp) ── */}
          {showStyleAndPerspective && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Góc nhìn</label>
              <select className="w-full rounded-xl bg-gray-50 border border-gray-300 text-gray-900 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" value={perspective} onChange={(e) => setPerspective(e.target.value)}>
                <option value="Front">Chính diện (Front)</option>
                <option value="Side">Mặt ngang (Side)</option>
                <option value="Back">Mặt sau (Back)</option>
                <option value="Isometric">Isometric (2.5D)</option>
              </select>
            </div>
          )}

          {/* ── Tỉ lệ / Kích thước ── */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Tỉ lệ / Kích thước</label>
            <select className="w-full rounded-xl bg-gray-50 border border-gray-300 text-gray-900 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" value={ratio} onChange={(e) => setRatio(e.target.value)}>
              {assetType === 'background' ? (
                <>
                  <option value="1:1">Vuông (1:1)</option>
                  <option value="16:9">Ngang HD (16:9)</option>
                  <option value="9:16">Dọc (9:16)</option>
                  <option value="custom">Tự do (Custom)</option>
                </>
              ) : (
                <>
                  <option value="1:1">64x64 px (Chuẩn)</option>
                  <option value="16:9">128x128 px (Lớn)</option>
                  <option value="9:16">32x32 px (Nhỏ)</option>
                  <option value="custom">Tự do (Custom)</option>
                </>
              )}
            </select>
            {ratio === 'custom' && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Chiều rộng (W)</label>
                  {assetType === 'tileset' ? (
                    <input 
                      type="number" 
                      className="w-full rounded-lg bg-gray-100 border border-gray-300 p-2 text-sm text-gray-500 cursor-not-allowed" 
                      value={tilesetAutoWidth} 
                      disabled 
                      title={`Tự động tính: ${columns} cột × ${getCellSizePx()}px = ${tilesetAutoWidth}px`}
                    />
                  ) : (
                    <input type="number" min="16" max="2048" className="w-full rounded-lg bg-gray-50 border border-gray-300 p-2 text-sm focus:border-blue-500 outline-none transition" value={customWidth} onChange={e => setCustomWidth(parseInt(e.target.value) || 512)} />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Chiều cao (H)</label>
                  <input type="number" min="16" max="2048" className="w-full rounded-lg bg-gray-50 border border-gray-300 p-2 text-sm focus:border-blue-500 outline-none transition" value={customHeight} onChange={e => setCustomHeight(parseInt(e.target.value) || 512)} />
                </div>
              </div>
            )}
            {/* Tileset auto-calc hint */}
            {assetType === 'tileset' && ratio === 'custom' && (
              <p className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg mt-1">
                ℹ️ Chiều rộng tự động = {columns} cột × {getCellSizePx()}px = <strong>{tilesetAutoWidth}px</strong>
              </p>
            )}
          </div>

          {/* ── Type Specific Fields ── */}
          {assetType === 'background' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Thời gian trong ngày</label>
              <select className="w-full rounded-xl bg-gray-50 border border-gray-300 text-gray-900 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)}>
                <option value="day">Ban ngày (Day)</option>
                <option value="night">Ban đêm (Night)</option>
                <option value="dusk">Hoàng hôn (Dusk)</option>
                <option value="dawn">Bình minh (Dawn)</option>
              </select>
            </div>
          )}

          {assetType === 'tilesheet' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Hành động</label>
                <input type="text" className="w-full rounded-lg bg-gray-50 border border-gray-300 p-2 text-sm focus:border-blue-500 outline-none transition" value={action} onChange={e => setAction(e.target.value)} placeholder="VD: running"/>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Số khung hình</label>
                <input type="number" min="2" max="24" className="w-full rounded-lg bg-gray-50 border border-gray-300 p-2 text-sm focus:border-blue-500 outline-none transition" value={frames} onChange={e => setFrames(parseInt(e.target.value) || 10)} />
              </div>
            </div>
          )}

          {assetType === 'tileset' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Số cột (Columns)</label>
                <input type="number" min="2" max="16" className="w-full rounded-lg bg-gray-50 border border-gray-300 p-2 text-sm focus:border-blue-500 outline-none transition" value={columns} onChange={e => setColumns(parseInt(e.target.value) || 8)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Size ô (Cell)</label>
                <select className="w-full rounded-lg bg-gray-50 border border-gray-300 p-2 text-sm focus:border-blue-500 outline-none transition" value={cellSize} onChange={e => setCellSize(e.target.value)}>
                  <option value="16x16">16x16</option>
                  <option value="32x32">32x32</option>
                  <option value="64x64">64x64</option>
                </select>
              </div>
            </div>
          )}

          {(assetType === 'pixel' || assetType === 'pixel-from-image') && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Block Size</label>
                <input type="number" min="2" max="32" className="w-full rounded-lg bg-gray-50 border border-gray-300 p-2 text-sm focus:border-blue-500 outline-none transition" value={blockSize} onChange={e => setBlockSize(parseInt(e.target.value) || 8)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Màu sắc</label>
                <input type="number" min="2" max="256" className="w-full rounded-lg bg-gray-50 border border-gray-300 p-2 text-sm focus:border-blue-500 outline-none transition" value={colors} onChange={e => setColors(parseInt(e.target.value) || 32)} />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ═══════════ RIGHT PANEL: Mô tả & Kết quả ═══════════ */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        {/* ── Prompt area ── */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Mô tả Asset</h2>
            <span className="text-xs font-medium bg-red-100 text-red-700 px-3 py-1 rounded-full">AI Team Pipeline</span>
          </div>
          
          {/* Textarea — nút "Tạo Asset" đã được tách ra ngoài */}
          <textarea
            className="w-full h-32 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 p-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition resize-none placeholder-gray-400"
            placeholder={(assetType === 'tileset') ? "Nhập các mô tả cho ô gạch (cách nhau bởi dấu phẩy, VD: grass tile, water tile)..." : "Mô tả chi tiết ý tưởng của bạn (VD: Một chiến binh hiệp sĩ mặc giáp bạc, đang cầm kiếm lửa...)"}
            value={assetType === 'tileset' ? tiles : (assetType === 'sprite-from-image' ? extraPrompt : prompt)}
            onChange={(e) => {
              if (assetType === 'tileset') setTiles(e.target.value);
              else if (assetType === 'sprite-from-image') setExtraPrompt(e.target.value);
              else setPrompt(e.target.value);
            }}
          />
          
          {/* Nút "Tạo Asset" tách riêng dưới textarea để không đè lên text */}
          <div className="flex justify-end mt-3">
            <button 
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Đang xử lý...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> Tạo Asset</>
              )}
            </button>
          </div>
        </div>

        {/* ── Khung Kết Quả ── */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Kết quả</h2>
          
          {!imageResult && !isGenerating && (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
              <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <p className="font-medium">Hình ảnh AI tạo ra sẽ hiển thị ở đây</p>
            </div>
          )}

          {isGenerating && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-red-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-red-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                </div>
              </div>
              <p className="text-gray-600 font-medium animate-pulse">AI đang vẽ... Vui lòng đợi!</p>
            </div>
          )}

          {imageResult && !isGenerating && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="relative group rounded-xl overflow-hidden bg-[url('https://t3.ftcdn.net/jpg/03/76/74/78/360_F_376747823_L8il80K6cKQcbGAEHTk2vwE4h3sJ7m2l.jpg')] bg-repeat border border-gray-200">
                <img 
                  src={imageResult} 
                  alt="Generated Asset" 
                  className="w-full max-h-[500px] object-contain"
                  style={{ imageRendering: (artStyle === 'Pixel Art' || assetType === 'pixel' || assetType === 'pixel-from-image') ? 'pixelated' : 'auto' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowPreviewModal(true)}
                      className="bg-white/90 hover:bg-white text-gray-900 font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-transform hover:scale-105"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                      Phóng to
                    </button>
                    <a 
                      href={imageResult} 
                      download="mindx_asset.png"
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-transform hover:scale-105"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      Tải xuống
                    </a>
                  </div>
                </div>
              </div>

              {/* ── Thời gian formatted ── */}
              {generationTime && (
                <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Hoàn tất trong {formatDuration(generationTime)}
                  </span>
                  <span>Độ phân giải gốc (AI Team Pipeline)</span>
                </div>
              )}

              {/* Tích hợp Slicer / Animation Preview cho Tilesheet / Tileset */}
              {(assetType === 'tilesheet' || assetType === 'tileset') && (
                <AnimationPreview 
                  imageUrl={imageResult} 
                  frames={metadata?.frames || []} 
                  layoutFormat={metadata?.layout_format || 'single'}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <SpritePreviewModal 
        isOpen={showPreviewModal} 
        onClose={() => setShowPreviewModal(false)} 
        imageUrl={imageResult} 
        metadata={metadata}
      />
    </div>
  );
};

export default Generator;
