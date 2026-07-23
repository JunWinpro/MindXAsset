import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Gallery = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/gallery');
        setItems(res.data);
      } catch (err) {
        console.error('Lỗi khi tải thư viện:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  return (
    <div className="flex-1 flex flex-col p-8 max-w-[1920px] mx-auto w-full animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Thư viện Asset của bạn</h2>
          <p className="text-gray-600 mt-2">Nơi lưu trữ các hình ảnh bạn đã tạo từ MindX Generator và lưu trên Cloudinary.</p>
        </div>
        <Link to="/generator" className="px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 shadow-sm transition-all flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo mới
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white border border-gray-200 rounded-3xl shadow-sm text-center min-h-[50vh]">
          <div className="w-24 h-24 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-700">Chưa có Asset nào</h3>
          <p className="text-gray-500 mt-2 max-w-md">Bạn chưa tạo Asset nào. Hãy vào tính năng "Tạo Ảnh" để bắt đầu xây dựng thư viện game của riêng mình nhé!</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {items.map((item) => (
            <div key={item.id} className="break-inside-avoid bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="relative overflow-hidden bg-gray-50 flex items-center justify-center min-h-[150px]">
                <img 
                  src={item.image_url} 
                  alt={item.prompt} 
                  className="w-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <a href={item.image_url} target="_blank" rel="noopener noreferrer" className="bg-white text-gray-900 p-3 rounded-full hover:bg-gray-100 transition-colors shadow-lg">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-lg uppercase tracking-wider">{item.type}</span>
                  <span className="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-lg">{item.style}</span>
                </div>
                <p className="text-gray-800 text-sm font-medium line-clamp-3 mb-3 leading-relaxed" title={item.prompt}>
                  {item.prompt}
                </p>
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                  <span>{new Date(item.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery;
