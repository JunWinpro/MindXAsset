import React, { useState, useMemo, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import CanvasPreview from './CanvasPreview';
import CategoryMenu from './CategoryMenu';
import CustomizerInspector from './CustomizerInspector';
import { assetConfig, colorPalettes, getLayerSource } from './assets_config';
import { monsterConfig, getMonsterLayers } from './monster_config';
import SpritePreviewModal from '../../components/SpritePreviewModal';

const CHARACTER_MODELS = [
  {
    id: 'pipoya',
    name: 'RPG Pixel (Chung)',
    frameSize: 32,
    isSpritesheet: true,
    config: assetConfig,
    categories: [
      { id: 'bases', label: 'Body (Thân)', icon: '👤' },
      { id: 'eyes', label: 'Eyes (Mắt)', icon: '👁️' },
      { id: 'hairs', label: 'Hair (Tóc)', icon: '💇' },
      { id: 'tops', label: 'Clothes (Áo)', icon: '👕' },
      { id: 'hats', label: 'Hats (Nón/Mũ)', icon: '🎩' },
      { id: 'glasses', label: 'Glasses (Kính)', icon: '🕶️' },
      { id: 'ears', label: 'Ears (Tai thú)', icon: '🐱' },
      { id: 'tails', label: 'Tails (Đuôi)', icon: '🦊' },
      { id: 'items', label: 'Items (Vật phẩm)', icon: '⚔️' },
      { id: 'cloaks', label: 'Cloaks (Áo choàng)', icon: '🦇' },
      { id: 'beards', label: 'Beards (Râu)', icon: '🧔' },
      { id: 'hairadds', label: 'Hair Adds (Phụ kiện tóc)', icon: '🎀' },
      { id: 'makeup', label: 'Makeup (Trang điểm)', icon: '💄' }
    ]
  },
  {
    id: 'monster',
    name: 'Monster (Quái Vật)',
    frameSize: 256,
    isSpritesheet: false,
    config: monsterConfig,
    categories: [
      { id: 'body', label: 'Body (Thân)', icon: '👾' },
      { id: 'leg', label: 'Legs (Chân)', icon: '🦵' },
      { id: 'arm', label: 'Arms (Tay)', icon: '💪' },
      { id: 'detail', label: 'Sừng/Tai', icon: '✨' },
      { id: 'eye', label: 'Eyes (Mắt)', icon: '👁️' },
      { id: 'eyebrow', label: 'Eyebrow (Lông mày)', icon: '🤨' },
      { id: 'mouth', label: 'Mouth (Miệng)', icon: '👄' },
      { id: 'nose', label: 'Nose (Mũi)', icon: '👃' }
    ]
  }
];

const CharacterBuilder = () => {
  // Lựa chọn Model
  const [currentModelId, setCurrentModelId] = useState('pipoya');
  const currentModel = CHARACTER_MODELS.find(m => m.id === currentModelId);

  // Tên nhân vật
  const [characterName, setCharacterName] = useState('MindX Character');

  // Tab danh mục đang chọn ở cột trái
  const [activeCategory, setActiveCategory] = useState(currentModel.categories[0].id);

  // Trạng thái nền trong suốt
  const [transparentBg, setTransparentBg] = useState(false);

  // Tham chiếu tới CanvasPreview để gọi hàm download
  const canvasPreviewRef = useRef(null);

  // Lựa chọn kiểu dáng (Variant ID)
  const [selections, setSelections] = useState({
    bases: 'bases_001',
    eyes: 'eyes_001',
    hairs: 'hairs_001',
    tops: 'tops_001',
    hats: 'hats_none',
    glasses: 'glasses_none',
    ears: 'ears_none',
    tails: 'tails_none',
    items: 'items_none',
    cloaks: 'cloaks_none',
    beards: 'beards_none',
    hairadds: 'hairadds_none',
    makeup: 'makeup_none',
    action: 'idle'
  });

  // Reset selections when changing model
  useEffect(() => {
    const newSelections = { action: 'idle' };
    currentModel.categories.forEach(cat => {
      const options = currentModel.config[cat.id] || [];
      if (options.length > 0) {
        newSelections[cat.id] = options[0].id;
      }
    });
    setSelections(newSelections);
    setActiveCategory(currentModel.categories[0].id);
  }, [currentModelId]);

  // Bảng màu cho từng bộ phận (Color Modulation)
  const [colors, setColors] = useState({});

  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [imageResult, setImageResult] = useState(null);

  // Đổi Option kiểu dáng
  const handleSelectOption = (category, id) => {
    setSelections(prev => ({ ...prev, [category]: id }));
  };

  // Đổi Màu sắc
  const handleSelectColor = (category, hexColor) => {
    setColors(prev => ({ ...prev, [category]: hexColor }));
  };

  // Nút RANDOMIZE: Phối ngẫu nhiên toàn bộ nhân vật
  const handleRandomize = () => {
    const randomNames = ['MindX Hero', 'Pixel Dev', 'Code Master', 'Data Wizard', 'Design Guru'];
    setCharacterName(randomNames[Math.floor(Math.random() * randomNames.length)]);

    const newSelections = { ...selections };

    currentModel.categories.forEach(cat => {
      const options = currentModel.config[cat.id] || [];
      if (options.length > 0) {
        const randOpt = options[Math.floor(Math.random() * options.length)];
        newSelections[cat.id] = randOpt.id;
      }
    });

    setSelections(newSelections);
    toast.info("Đã tạo nhân vật ngẫu nhiên! 🎲");
  };

  // Tải ảnh PNG trực tiếp
  const handleDownloadPNG = () => {
    if (canvasPreviewRef.current) {
      canvasPreviewRef.current.download(`${characterName.replace(/\s+/g, '_')}_sprite.png`);
      toast.success("Đã tải ảnh về máy!");
    }
  };

  // Tổng hợp layers kèm xử lý Exclusion Rules
  const activeLayers = useMemo(() => {
    if (currentModel.id === 'monster') {
      return getMonsterLayers(selections).map(l => {
        const baseCat = l.category.split('_')[0];
        return {
          ...l,
          color: colors[baseCat] || colors[l.category] || '#ffffff'
        };
      }).sort((a, b) => (a.z_index || 0) - (b.z_index || 0));
    }

    let layers = [];
    const selectedOptions = {};

    currentModel.categories.forEach(cat => {
      const selectedId = selections[cat.id];
      const option = (currentModel.config[cat.id] || []).find(o => o.id === selectedId);
      if (option) selectedOptions[cat.id] = option;
    });

    // Xác định layer bị ẩn do Exclusion Rules (VD: mũ trùm đầu thì ẩn tóc)
    const hiddenCategories = new Set();
    Object.values(selectedOptions).forEach(option => {
      if (option?.rules?.hides) {
        option.rules.hides.forEach(hiddenCat => hiddenCategories.add(hiddenCat));
      }
    });

    // Render layers
    currentModel.categories.forEach(cat => {
      if (!hiddenCategories.has(cat.id) && selectedOptions[cat.id]) {
        const opt = selectedOptions[cat.id];
        // Lấy danh sách layers (trả về mảng {src, z_index})
        const layerArr = getLayerSource(cat.id, opt.id, currentModel.config);
        if (layerArr && layerArr.length > 0) {
          layerArr.forEach(l => {
            let layerColor = colors[cat.id] || '#ffffff';
            // Arms should inherit skin color from 'base' or 'bases'
            if (cat.id === 'arms') {
              layerColor = colors['base'] || colors['bases'] || '#ffffff';
            }

            layers.push({
              id: opt.id,
              name: opt.name,
              category: cat.id,
              src: l.src,
              z_index: l.z_index,
              color: layerColor
            });
          });
        }
      }
    });

    // Sắp xếp theo z_index từ nhỏ đến lớn (để vẽ từ sau ra trước)
    layers.sort((a, b) => (a.z_index || 0) - (b.z_index || 0));

    return layers;
  }, [selections, colors, currentModel]);

  // Gửi thông tin sang AI / Backend
  const handleGenerate = async () => {
    setIsGenerating(true);

    const formOutput = {
      name: characterName,
      config: selections,
      colors: colors,
      action: selections.action,
      export_format: 'spritesheet',
      resolution: '512x512',
      transparent: transparentBg
    };

    try {
      const res = await fetch('http://localhost:5000/api/generate-custom-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formOutput)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi server');

      setImageResult(data.imageUrl);
      setShowPreviewModal(true);
      toast.success("Tạo hoạt ảnh AI thành công!");
    } catch (error) {
      console.error(error);
      toast.error(`Có lỗi xảy ra: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 bg-[#F8F9FA] py-8 px-4 sm:px-8 font-sans border-t border-gray-200">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">

        {/* Banner Tiêu đề */}
        <div className="text-center mb-2">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 font-sans tracking-tight">
            CHARACTER STUDIO
          </h1>
          <p className="text-sm text-gray-500 font-sans mt-2">
            Xây dựng nhân vật Pixel Art hoàn chỉnh với Custom Layering & Nhuộm màu động
          </p>
        </div>

        {/* Bố cục 3 CỘT chuẩn */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

          {/* CỘT 1: Danh mục chọn nhanh (Trái) */}
          <div className="md:col-span-3 flex flex-col gap-4">
            {/* Chọn Model Nhân vật */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                Loại Nhân Vật
              </h2>
              <select
                value={currentModelId}
                onChange={(e) => setCurrentModelId(e.target.value)}
                className="w-full bg-red-50 text-red-700 font-bold border border-red-200 py-2.5 px-3 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow"
              >
                {CHARACTER_MODELS.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                Bộ Phận
              </h2>
              <CategoryMenu
                categories={currentModel.categories}
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
              />
            </div>

            {/* Chế độ động tác (Action Pose) */}
            {currentModel.isSpritesheet && (
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <label className="text-xs font-bold uppercase tracking-widest block mb-2 text-gray-500">
                  Động tác (Action)
                </label>
                <select
                  value={selections.action}
                  onChange={(e) => handleSelectOption('action', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-800 py-2.5 px-3 rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow"
                >
                  <option value="idle">Đứng im (Idle)</option>
                  <option value="run">Chạy (Run)</option>
                  <option value="attack">Tấn công (Attack)</option>
                </select>
              </div>
            )}
          </div>

          {/* CỘT 2: Khung xem trước nhân vật (Giữa) */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm w-full flex flex-col items-center">

              {/* Công tắc Xóa nền */}
              <div className="w-full flex justify-end mb-3">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={transparentBg}
                    onChange={(e) => setTransparentBg(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                  />
                  Xóa phông nền (Transparent)
                </label>
              </div>

              {/* Canvas Preview */}
              <CanvasPreview
                ref={canvasPreviewRef}
                layers={activeLayers}
                width={currentModel.isSpritesheet ? 380 : 360}
                height={currentModel.isSpritesheet ? 380 : 640}
                transparentBg={transparentBg}
                frameSize={currentModel.frameSize}
                isSpritesheet={currentModel.isSpritesheet}
              />

              {/* Tên nhân vật */}
              <div className="mt-5 w-full flex justify-center">
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  className="text-2xl font-black font-sans text-gray-800 text-center border-b-2 border-transparent hover:border-gray-300 focus:border-red-500 focus:outline-none transition-all py-1 w-4/5 bg-transparent"
                  placeholder="Nhập tên..."
                />
              </div>
            </div>

            {/* Các nút hành động (Row) */}
            <div className="grid grid-cols-2 gap-3 w-full">
              {/* Nút RANDOMIZE */}
              <button
                onClick={handleRandomize}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-sans font-bold text-sm uppercase tracking-wider rounded-xl border border-gray-300 shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
              >
                <span className="text-lg">🎲</span> Ngẫu nhiên
              </button>

              {/* Nút Download PNG */}
              <button
                onClick={handleDownloadPNG}
                className="w-full py-3 bg-gray-800 hover:bg-gray-900 text-white font-sans font-bold text-sm uppercase tracking-wider rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
              >
                <span className="text-lg">⬇️</span> Lưu ảnh PNG
              </button>
            </div>

            {/* Nút Xuất Sprite / Tạo AI */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`
                w-full py-3.5 px-6 font-sans font-bold text-base uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm
                ${isGenerating
                  ? 'bg-red-300 text-white cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-md'
                }
              `}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang xuất qua AI...
                </>
              ) : (
                <>
                  <span>⚡</span> Xuất Hoạt Ảnh (AI Generator)
                </>
              )}
            </button>
          </div>

          {/* CỘT 3: Tùy biến chi tiết Kiểu dáng & Màu sắc (Phải) */}
          <div className="md:col-span-4 h-full">
            <CustomizerInspector
              activeCategory={activeCategory}
              selections={selections}
              colors={colors}
              onSelectOption={handleSelectOption}
              onSelectColor={handleSelectColor}
              currentConfig={currentModel.config}
            />
          </div>

        </div>

      </div>

      {/* Modal hiển thị Spritesheet AI */}
      <SpritePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        imageUrl={imageResult}
        actionName={selections.action}
      />
    </div>
  );
};

export default CharacterBuilder;
