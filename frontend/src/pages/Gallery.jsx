import React from 'react';
import { Link } from 'react-router-dom';

const Gallery = () => {
  return (
    <div className="flex-1 flex flex-col p-8 max-w-[1920px] mx-auto w-full animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Thư viện Asset của bạn</h2>
          <p className="text-gray-600 mt-2">Nơi lưu trữ các hình ảnh bạn đã tạo từ MindX Generator.</p>
        </div>
        <Link to="/generator" className="px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 shadow-sm transition-all flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo mới
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center p-16 bg-white border border-gray-200 rounded-3xl shadow-sm text-center min-h-[50vh]">
        <div className="w-24 h-24 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-700">Chưa có Asset nào</h3>
        <p className="text-gray-500 mt-2 max-w-md">Bạn chưa tạo Asset nào. Hãy vào tính năng "Tạo Ảnh" để bắt đầu xây dựng thư viện game của riêng mình nhé!</p>
      </div>
    </div>
  );
};

export default Gallery;
