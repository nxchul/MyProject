import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import Header from './components/Header';
import Services from './components/Services';
import Footer from './components/Footer';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'services'>('chat');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 왼쪽 사이드바 - 서비스 정보 */}
          <div className="lg:w-1/3">
            <Services />
          </div>
          
          {/* 오른쪽 메인 영역 - 채팅 인터페이스 */}
          <div className="lg:w-2/3">
            <ChatInterface />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default App;