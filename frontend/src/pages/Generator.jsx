import React, { useState, useEffect } from 'react';

const Generator = () => {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('flux');
  
  // States chung
  const [assetType, setAssetType] = useState('Character'); // Cho model thường
  const [aiTeamAssetType, setAiTeamAssetType] = useState('sprite'); // Cho AI Team
  
  const [artStyle, setArtStyle] = useState('Pixel Art');
  const [perspective, setPerspective] = useState('Isometric');
  const [ratio, setRatio] = useState('1:1');
  const [transparent, setTransparent] = useState(true);
  
  // AI Team specific
  const [timeOfDay, setTimeOfDay] = useState('day');
  const [aiTeamAction, setAiTeamAction] = useState('running');
  const [aiTeamFrames, setAiTeamFrames] = useState(10);
  const [aiTeamColumns, setAiTeamColumns] = useState(8);
  const [aiTeamCellSize, setAiTeamCellSize] = useState('32x32');
  const [aiTeamSpritePose, setAiTeamSpritePose] = useState('idle');
  const [aiTeamPixelPalette, setAiTeamPixelPalette] = useState('gameboy');
  const [imageResult, setImageResult] = useState(null);
  const [zipUrl, setZipUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Tự động điều chỉnh các tuỳ chọn mặc định khi đổi Model để tránh lỗi UI
  useEffect(() => {
    if (model === 'ai_team') {
      if (!['background', 'sprite', 'pixel', 'tilesheet', 'tileset'].includes(aiTeamAssetType)) {
        setAiTeamAssetType('sprite');
      }
    }
  }, [model, aiTeamAssetType]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Vui lòng nhập ý tưởng của bạn!');
      return;
    }
    setError('');
    setLoading(true);
    setImageResult(null);
    setZipUrl(null);

    try {
      const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://mindxasset.onrender.com';
      let endpoint = `${baseUrl}/api/generate-image`;
      
      let bodyData = { 
        prompt, 
        model,
        assetType: model === 'ai_team' ? aiTeamAssetType : assetType,
        artStyle,
        perspective,
        ratio,
        transparent
      };

      if (model === 'huggingface') {
        endpoint = `${baseUrl}/api/generate-image-hf`;
      } else if (model === 'ai_team') {
        if (aiTeamAssetType === 'background') {
          endpoint = `${baseUrl}/api/generate-background`;
          bodyData = {
            subject: prompt,
            size_key: ratio === '1:1' ? 'background_sq' : (ratio === '16:9' ? 'background_hd' : 'background_sd'),
            style: artStyle,
            time_of_day: timeOfDay,
            seed: -1
          };
        } else if (aiTeamAssetType === 'sprite' || aiTeamAssetType === 'pixel') {
          endpoint = `${baseUrl}/api/generate-sprite`;
          let finalPrompt = prompt;
          if (aiTeamAssetType === 'sprite') {
            finalPrompt += ` pose: ${aiTeamSpritePose}`;
          } else if (aiTeamAssetType === 'pixel') {
            finalPrompt += ` color palette: ${aiTeamPixelPalette} limited colors`;
          }
          bodyData = {
            subject: finalPrompt,
            size_key: ratio === '1:1' ? '64x64' : (ratio === '16:9' ? '128x128' : '32x32'),
            style: artStyle,
            perspective: perspective,
            seed: -1
          };
        } else if (aiTeamAssetType === 'tilesheet') {
          endpoint = `${baseUrl}/api/generate-tilesheet`;
          bodyData = {
            subject: prompt,
            action: aiTeamAction,
            frames: aiTeamFrames,
            style: artStyle,
            perspective: perspective,
            seed: -1
          };
        } else if (aiTeamAssetType === 'tileset') {
          endpoint = `${baseUrl}/api/generate-tileset`;
          bodyData = {
            subject: prompt,
            size_key: aiTeamCellSize,
            columns: aiTeamColumns,
            style: artStyle,
            perspective: perspective,
            seed: -1
          };
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();

      if (!response.ok || !(data.image || data.file_path)) {
        throw new Error(data.error || 'Đã có lỗi xảy ra!');
      }

      if (data.file_path) {
        setImageResult(`${baseUrl}/${data.file_path}`);
      } else {
        setImageResult(data.image);
      }
      
      if (data.zip_url) {
        setZipUrl(`${baseUrl}/${data.zip_url}`);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!imageResult) return;
    
    if (imageResult.startsWith('http')) {
      try {
        const response = await fetch(imageResult);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `mindx-asset-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error('Lỗi khi tải ảnh URL:', err);
        window.open(imageResult, '_blank');
      }
      return;
    }
    
    try {
      const [header, base64] = imageResult.split(',');
      const mimeMatch = header.match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      const blob = new Blob([byteArray], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      
      const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png';
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `mindx-asset-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Lỗi khi tải ảnh:', err);
      const a = document.createElement('a');
      a.href = imageResult;
      a.download = `mindx-asset-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row p-4 lg:p-8 gap-8 max-w-[1920px] mx-auto w-full">
      {/* Left Column: Control Panel */}
      <aside className="w-full lg:w-1/3 xl:w-1/4 flex flex-col gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
          <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-100 pb-3">Cấu hình Asset</h2>
          
          {/* Prompt */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Mô tả ý tưởng (Tiếng Việt)</label>
            <textarea
              className="w-full h-24 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 p-4 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 resize-none outline-none transition"
              placeholder="VD: Một thanh kiếm lửa bùng cháy..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* Model */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">AI Model / Pipeline</label>
            <select
              className="w-full rounded-xl bg-gray-50 border border-gray-300 text-gray-900 p-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition cursor-pointer"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              <option value="huggingface">Hugging Face (Miễn phí)</option>
              <option value="gemini">Gemini (Dịch & Tối ưu Prompt)</option>
              <option value="flux">Pollinations (Vẽ trực tiếp)</option>
              <option value="ai_team">AI Team Pipeline (Chuyên sâu)</option>
            </select>
          </div>

          {/* Asset Type & Style (Grid 2 cột LUÔN HIỂN THỊ ĐỒNG BỘ) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Loại Asset</label>
              {model === 'ai_team' ? (
                <select
                  className="w-full rounded-xl bg-gray-50 border border-red-300 text-gray-900 p-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition cursor-pointer"
                  value={aiTeamAssetType}
                  onChange={(e) => setAiTeamAssetType(e.target.value)}
                >
                  <option value="background">Cảnh quan</option>
                  <option value="sprite">Nhân vật / Vật phẩm</option>
                  <option value="pixel">Ép Pixel Art</option>
                  <option value="tilesheet">Hoạt ảnh (Tilesheet)</option>
                  <option value="tileset">Gạch môi trường (Tileset)</option>
                </select>
              ) : (
                <select
                  className="w-full rounded-xl bg-gray-50 border border-gray-300 text-gray-900 p-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition cursor-pointer"
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                >
                  <option value="Character">Nhân vật</option>
                  <option value="Prop/Item">Vật phẩm</option>
                  <option value="Background">Hình nền</option>
                  <option value="UI Element">Giao diện (UI)</option>
                  <option value="VFX Effect">Hiệu ứng (VFX)</option>
                </select>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Phong cách</label>
              <select
                className="w-full rounded-xl bg-gray-50 border border-gray-300 text-gray-900 p-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition cursor-pointer"
                value={artStyle}
                onChange={(e) => setArtStyle(e.target.value)}
              >
                <option value="Pixel Art">Pixel Art</option>
                <option value="3D Low Poly">3D Low Poly</option>
                <option value="Anime">Anime</option>
                <option value="Voxel">Voxel</option>
                <option value="Hand-drawn 2D">Vẽ tay 2D</option>
                <option value="Realistic">Chân thực</option>
              </select>
            </div>
          </div>

          {/* Perspective & Size (Grid 2 cột LUÔN HIỂN THỊ ĐỒNG BỘ) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Góc nhìn</label>
              <select
                className="w-full rounded-xl bg-gray-50 border border-gray-300 text-gray-900 p-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition cursor-pointer"
                value={perspective}
                onChange={(e) => setPerspective(e.target.value)}
              >
                <option value="Isometric">Isometric (2.5D)</option>
                <option value="Top-down">Từ trên xuống</option>
                <option value="Side-scroller">Mặt ngang (2D)</option>
                <option value="Portrait">Chân dung</option>
                <option value="Front">Chính diện</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Tỉ lệ / Kích thước</label>
              <select
                className="w-full rounded-xl bg-gray-50 border border-gray-300 text-gray-900 p-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition cursor-pointer"
                value={ratio}
                onChange={(e) => setRatio(e.target.value)}
              >
                {model === 'ai_team' && (aiTeamAssetType === 'sprite' || aiTeamAssetType === 'pixel') ? (
                  <>
                    <option value="1:1">64x64 px (Chuẩn)</option>
                    <option value="16:9">128x128 px (Lớn)</option>
                    <option value="9:16">32x32 px (Nhỏ)</option>
                  </>
                ) : (
                  <>
                    <option value="1:1">Vuông (1:1)</option>
                    <option value="16:9">Ngang (16:9)</option>
                    <option value="9:16">Dọc (9:16)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* AI Team Specific Options (Hiển thị mượt mà bên dưới) */}
          {model === 'ai_team' && (
            <div className="flex flex-col gap-3 p-4 bg-red-50/50 border border-red-100 rounded-xl">

              
              {aiTeamAssetType === 'background' && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700">Thời gian trong ngày</label>
                  <select className="w-full rounded-lg bg-white border border-gray-300 p-2 text-sm" value={timeOfDay} onChange={e => setTimeOfDay(e.target.value)}>
                    <option value="day">Ban ngày (Day)</option>
                    <option value="night">Ban đêm (Night)</option>
                    <option value="dusk">Hoàng hôn (Dusk)</option>
                    <option value="dawn">Bình minh (Dawn)</option>
                  </select>
                </div>
              )}

              {aiTeamAssetType === 'tilesheet' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-700">Hành động</label>
                    <input type="text" className="w-full rounded-lg bg-white border border-gray-300 p-2 text-sm" value={aiTeamAction} onChange={e => setAiTeamAction(e.target.value)} placeholder="VD: running"/>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-700">Số khung hình</label>
                    <input type="number" min="2" max="24" className="w-full rounded-lg bg-white border border-gray-300 p-2 text-sm" value={aiTeamFrames} onChange={e => setAiTeamFrames(parseInt(e.target.value) || 10)} />
                  </div>
                </div>
              )}

              {aiTeamAssetType === 'tileset' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-700">Kích thước ô (Cell)</label>
                    <select className="w-full rounded-lg bg-white border border-gray-300 p-2 text-sm" value={aiTeamCellSize} onChange={e => setAiTeamCellSize(e.target.value)}>
                      <option value="16x16">16x16</option>
                      <option value="32x32">32x32</option>
                      <option value="64x64">64x64</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-700">Số cột (Columns)</label>
                    <input type="number" min="2" max="16" className="w-full rounded-lg bg-white border border-gray-300 p-2 text-sm" value={aiTeamColumns} onChange={e => setAiTeamColumns(parseInt(e.target.value) || 8)} />
                  </div>
                </div>
              )}
              
              {aiTeamAssetType === 'sprite' && (
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-700">Tư thế (Pose)</label>
                    <select className="w-full rounded-lg bg-white border border-gray-300 p-2 text-sm" value={aiTeamSpritePose} onChange={e => setAiTeamSpritePose(e.target.value)}>
                      <option value="idle">Đứng yên (Idle)</option>
                      <option value="walking">Đi bộ (Walking)</option>
                      <option value="running">Chạy (Running)</option>
                      <option value="attacking">Tấn công (Attacking)</option>
                    </select>
                  </div>
                </div>
              )}
              
              {aiTeamAssetType === 'pixel' && (
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-700">Bảng màu (Color Palette)</label>
                    <select className="w-full rounded-lg bg-white border border-gray-300 p-2 text-sm" value={aiTeamPixelPalette} onChange={e => setAiTeamPixelPalette(e.target.value)}>
                      <option value="gameboy">Gameboy (4 colors)</option>
                      <option value="monochrome">Đơn sắc (Monochrome)</option>
                      <option value="nes">NES (8-bit)</option>
                      <option value="full">Đầy đủ màu (Full Color)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Toggle Nền Trong Suốt */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-sm font-semibold text-gray-800">Nền trong suốt (Tách nền)</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={transparent}
                onChange={(e) => setTransparent(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-3">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`mt-2 w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-sm flex items-center justify-center gap-2 ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                : 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang khởi tạo...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Tạo Asset
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Right Column: Canvas */}
      <section className="flex-1 bg-gray-100 border border-gray-200 rounded-2xl overflow-hidden relative shadow-sm flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Kết quả (Preview)
          </h3>
          <div className="flex gap-2">
            {imageResult && !zipUrl && (
              <button 
                onClick={handleDownloadImage}
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Tải ảnh
              </button>
            )}
            
            {zipUrl && (
              <a 
                href={zipUrl}
                download
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Tải xuống ZIP (Đã chia Frame/Tile)
              </a>
            )}
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-100/50 relative overflow-auto">
          {loading ? (
            <div className="w-full max-w-2xl aspect-square md:aspect-video rounded-2xl bg-white border-2 border-gray-200 border-dashed flex flex-col items-center justify-center gap-4 shadow-sm">
              <div className="w-16 h-16 rounded-full border-4 border-red-100 border-t-red-600 animate-spin"></div>
              <p className="text-gray-600 font-medium tracking-wider">Hệ thống đang render asset...</p>
            </div>
          ) : imageResult ? (
            <div className="relative group max-h-full max-w-full flex flex-col items-center gap-4">
              <img 
                src={imageResult} 
                alt="Generated Asset" 
                className="max-h-[60vh] object-contain rounded-xl shadow-xl transition-transform duration-500 hover:scale-[1.01]"
              />
              {zipUrl && (
                <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm text-sm font-medium text-gray-700 border border-gray-200">
                  <span className="text-blue-600 font-bold">✓</span> Đã đóng gói cắt khung/gạch vào file ZIP
                </div>
              )}
            </div>
          ) : (
            <div className="w-full max-w-2xl aspect-square md:aspect-video rounded-2xl bg-white border-2 border-gray-200 border-dashed flex flex-col items-center justify-center gap-4 text-gray-400 shadow-sm">
              <svg className="w-20 h-20 opacity-50 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-lg font-medium text-gray-500">Khu vực hiển thị Asset</p>
              <p className="text-sm">Hãy cấu hình ở bên trái và bấm "Tạo Asset"</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Generator;
