import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  
  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-600 tracking-tight">
            MindX Game Asset Generator
          </h1>
        </Link>
      </div>
      
      <nav className="flex items-center gap-6">
        <Link 
          to="/" 
          className={`font-medium transition-colors ${location.pathname === '/' ? 'text-red-600' : 'text-gray-600 hover:text-red-500'}`}
        >
          Trang chủ
        </Link>
        <Link 
          to="/generator" 
          className={`font-medium transition-colors ${location.pathname === '/generator' ? 'text-red-600' : 'text-gray-600 hover:text-red-500'}`}
        >
          Tạo Ảnh
        </Link>
        <Link 
          to="/gallery" 
          className={`font-medium transition-colors ${location.pathname === '/gallery' ? 'text-red-600' : 'text-gray-600 hover:text-red-500'}`}
        >
          Thư viện
        </Link>
        <button className="px-5 py-2 bg-gray-900 text-white rounded-full font-medium hover:bg-black transition shadow-sm">
          Đăng nhập
        </button>
      </nav>
    </header>
  );
};

export default Header;
