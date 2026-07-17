import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F8F9FA] text-gray-900 text-center animate-fade-in">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-8">
        
        {/* Banner */}
        <div className="flex flex-col gap-4">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm mb-2">
             <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900">
            Biến ý tưởng thành <span className="text-red-600">Game Asset</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mt-2">
            Hệ thống sinh ảnh AI tốc độ cao sử dụng công nghệ từ HuggingFace và Pollinations, tối ưu dành riêng cho việc tạo tài nguyên Game.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex gap-4 mt-4">
          <Link to="/generator" className="px-8 py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-md transition-all text-lg flex items-center gap-2">
            Bắt đầu tạo ảnh ngay
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <Link to="/gallery" className="px-8 py-4 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 shadow-sm transition-all text-lg">
            Xem thư viện
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-left hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center text-red-600 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Nhân Vật (Characters)</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Khởi tạo nhanh chóng các nguyên mẫu nhân vật với đa dạng góc nhìn (Isometric, Top-down, Side-scroller) và phong cách nghệ thuật tuỳ chỉnh (Pixel Art, Anime, 3D).</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-left hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center text-red-600 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Vật Phẩm (Props & Items)</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Sinh tự động các rương báu, vũ khí, vật phẩm trang bị. Hỗ trợ bóc tách nền (transparent background) sẵn sàng import trực tiếp vào Game Engine.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-left hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center text-red-600 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Bối Cảnh (Environments)</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Thiết kế concept art và hình nền chất lượng cao cho nhiều thể loại từ Dungeon tăm tối, Cyberpunk tương lai đến phong cảnh thần thoại hùng vĩ.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
