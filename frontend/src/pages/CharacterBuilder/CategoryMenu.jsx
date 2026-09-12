import React from 'react';

const CategoryMenu = ({ activeCategory, onSelectCategory }) => {
  const categories = [
    { id: 'bases', label: 'Body (Thân)', icon: '👤' },
    { id: 'eyes', label: 'Eyes (Mắt)', icon: '👁️' },
    { id: 'hairs', label: 'Hair (Tóc)', icon: '💇' },
    { id: 'tops', label: 'Clothes (Trang phục)', icon: '👕' },
    { id: 'hats', label: 'Hats (Nón/Mũ)', icon: '🎩' },
    { id: 'glasses', label: 'Glasses (Kính)', icon: '🕶️' },
    { id: 'ears', label: 'Ears (Tai thú)', icon: '🐱' },
    { id: 'tails', label: 'Tails (Đuôi)', icon: '🦊' },
    { id: 'items', label: 'Items (Vật phẩm)', icon: '⚔️' },
    { id: 'cloaks', label: 'Cloaks (Áo choàng)', icon: '🦇' },
    { id: 'beards', label: 'Beards (Râu)', icon: '🧔' },
    { id: 'hairadds', label: 'Hair Adds (Phụ kiện tóc)', icon: '🎀' },
    { id: 'makeup', label: 'Makeup (Trang điểm)', icon: '💄' }
  ];

  return (
    <div className="flex flex-col gap-2.5 w-full overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`
              w-full py-3 px-4 rounded-lg font-sans font-bold text-base tracking-wider uppercase flex items-center justify-between border-2 transition-all
              ${
                isActive
                  ? 'bg-red-600 text-white border-red-700 shadow-md translate-x-1'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-red-600 shadow-sm'
              }
            `}
          >
            <span>{cat.label}</span>
            <span className="text-xl">{cat.icon}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryMenu;
