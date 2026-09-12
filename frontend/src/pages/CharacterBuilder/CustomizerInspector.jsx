import React from 'react';
import { assetConfig, colorPalettes } from './assets_config';

const CustomizerInspector = ({
  activeCategory,
  selections,
  colors,
  onSelectOption,
  onSelectColor
}) => {
  const currentOptions = assetConfig[activeCategory] || [];
  const currentColor = colors[activeCategory] || '#ffffff';
  const presets = colorPalettes[activeCategory] || [];

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-5 flex flex-col gap-5 shadow-sm h-full">
      {/* Tiêu đề mục đang tùy biến */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <h3 className="text-xl font-bold uppercase tracking-wider text-gray-800 font-sans">
          {activeCategory}
        </h3>
        <span className="text-xs px-2.5 py-1 bg-red-100 text-red-700 font-bold rounded-full font-sans">
          {currentOptions.length} Kiểu
        </span>
      </div>

      {/* Danh sách Item Styles / Kiểu dáng (Ô vuông chọn) */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 font-sans">
          1. Chọn kiểu dáng:
        </label>
        <div className="grid grid-cols-4 gap-2.5 overflow-y-auto max-h-[320px] pr-2 custom-scrollbar">
          {currentOptions.map((opt) => {
            const isSelected = selections[activeCategory] === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onSelectOption(activeCategory, opt.id)}
                className={`
                  aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-1 transition-all
                  ${
                    isSelected
                      ? 'border-red-500 bg-red-50 shadow-sm ring-2 ring-red-200'
                      : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-red-300'
                  }
                `}
                title={opt.name}
              >
                {opt.id.endsWith('_none') ? (
                  <span className="text-sm font-bold text-gray-400">∅</span>
                ) : (
                  <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    ✦
                  </div>
                )}
                <span className={`text-[10px] font-sans truncate w-full text-center mt-1 ${isSelected ? 'font-bold text-red-700' : 'text-gray-500'}`}>
                  {opt.name.replace(/(Không mặc|Trọc|Không có|Chân trần)/g, 'Trống')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bảng màu sắc (Color Box & Sliders / Presets) */}
      <div className="flex flex-col gap-3 mt-2">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider font-sans">
          2. Nhuộm màu (Color Palette):
        </label>

        {/* Ô xem trước màu lớn (Color Preview Box) */}
        <div
          className="w-full h-14 rounded-lg border-2 border-gray-200 shadow-inner flex items-center justify-between px-4 transition-colors"
          style={{ backgroundColor: currentColor }}
        >
          <span
            className="text-xs font-sans font-black uppercase px-2 py-0.5 rounded bg-black/40 text-white backdrop-blur-sm"
          >
            {currentColor}
          </span>
          {/* Native HTML5 Color Picker ẩn bên dưới */}
          <label className="cursor-pointer bg-white/90 hover:bg-white text-gray-800 text-xs font-bold py-1.5 px-3 rounded shadow-sm border border-gray-200 transition-colors hover:text-red-600">
            Tự pha màu
            <input
              type="color"
              value={currentColor}
              onChange={(e) => onSelectColor(activeCategory, e.target.value)}
              className="sr-only"
            />
          </label>
        </div>

        {/* Các chấm màu gợi ý sẵn (Color Swatches) */}
        <div className="mt-1">
          <span className="text-[11px] text-gray-400 font-sans mb-2 block font-medium">
            Màu gợi ý ({presets.length}):
          </span>
          <div className="flex flex-wrap gap-2.5">
            {presets.map((colorObj) => {
              const isActiveColor = currentColor.toLowerCase() === colorObj.hex.toLowerCase();
              return (
                <button
                  key={colorObj.hex}
                  onClick={() => onSelectColor(activeCategory, colorObj.hex)}
                  title={colorObj.name}
                  className={`
                    w-8 h-8 rounded-full border-2 transition-transform shadow-sm
                    ${
                      isActiveColor
                        ? 'border-white scale-125 ring-2 ring-red-500'
                        : 'border-white hover:scale-110 hover:ring-2 hover:ring-gray-300'
                    }
                  `}
                  style={{ backgroundColor: colorObj.hex }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizerInspector;
