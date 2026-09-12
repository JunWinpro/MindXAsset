import React, { useState } from 'react';
import { assetConfig } from './assets_config';

const CustomizerSidebar = ({ selections, onSelect }) => {
  const [activeTab, setActiveTab] = useState('bases');

  const tabs = [
    { id: 'bases', label: 'Cơ sở', icon: '👤' },
    { id: 'hairs', label: 'Tóc', icon: '💇' },
    { id: 'outfits', label: 'Trang phục', icon: '👕' },
    { id: 'accessories', label: 'Phụ kiện', icon: '🕶️' }
  ];

  const currentOptions = assetConfig[activeTab];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 px-2 text-sm font-medium flex flex-col items-center gap-1 transition-colors whitespace-nowrap
              ${activeTab === tab.id 
                ? 'text-red-600 bg-white border-b-2 border-red-600' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="p-4 flex-1 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Chọn {tabs.find(t => t.id === activeTab)?.label}
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {currentOptions.map(option => {
            const isSelected = selections[activeTab] === option.id;
            return (
              <button
                key={option.id}
                onClick={() => onSelect(activeTab, option.id)}
                className={`
                  relative aspect-square rounded-xl border-2 transition-all p-2 flex flex-col items-center justify-center gap-2 overflow-hidden
                  ${isSelected 
                    ? 'border-red-500 bg-red-50 shadow-md transform scale-105' 
                    : 'border-gray-200 bg-gray-50 hover:border-red-300 hover:bg-white'
                  }
                `}
              >
                {/* Thumbnail preview */}
                <div className="w-16 h-16 bg-white rounded-lg border border-gray-100 flex items-center justify-center p-1 shadow-sm">
                  {option.src ? (
                    <img src={option.src} alt={option.name} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                  ) : (
                    <span className="text-gray-300">❌</span>
                  )}
                </div>
                <span className="text-xs font-medium text-center text-gray-700 leading-tight">
                  {option.name}
                </span>
                
                {isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CustomizerSidebar;
