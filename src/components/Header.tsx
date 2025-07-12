import React from 'react';
import { MessageCircle, Settings, Users } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* 로고 및 회사명 */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">YNS</h1>
              <p className="text-sm text-gray-600">TSMC Design House</p>
            </div>
          </div>
          
          {/* 네비게이션 메뉴 */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#services" className="text-gray-700 hover:text-blue-600 transition-colors">
              서비스
            </a>
            <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors">
              회사소개
            </a>
            <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors">
              문의하기
            </a>
          </nav>
          
          {/* 우측 아이콘들 */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
              <Users className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;