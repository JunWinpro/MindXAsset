import React from 'react';

const CategoryMenu = ({ categories = [], activeCategory, onSelectCategory }) => {
  return (
    <div className="flex flex-col gap-2.5 w-full overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`
              w-full py-2.5 px-3 rounded-lg font-sans font-bold text-sm tracking-wide uppercase flex items-center gap-3 border transition-all
              ${
                isActive
                  ? 'bg-red-600 text-white border-red-700 shadow-md translate-x-1'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-red-600 shadow-sm'
              }
            `}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${isActive ? 'bg-red-500/20' : 'bg-gray-100'}`}>
              {cat.icon}
            </div>
            <span className="truncate text-left flex-1">{cat.label}</span>
            {isActive && (
              <span className="text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryMenu;
