import { ChatContainer } from '../components/chat/ChatContainer';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">YNS</h1>
              <p className="text-sm text-gray-600">TSMC Design House Partner</p>
            </div>
            <nav className="hidden md:flex space-x-8">
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
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 좌측 정보 패널 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 서비스 카테고리 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">주요 서비스</h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <div>
                    <div className="font-medium">MPW Shuttle</div>
                    <div className="text-sm text-gray-600">일정 조회, 사양 확인</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <div>
                    <div className="font-medium">PDK/DK 제공</div>
                    <div className="text-sm text-gray-600">NDA 체결, 다운로드</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <div>
                    <div className="font-medium">설계 외주</div>
                    <div className="text-sm text-gray-600">Layout, P&R 서비스</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <div>
                    <div className="font-medium">IP 서비스</div>
                    <div className="text-sm text-gray-600">Datasheet, 시뮬레이션</div>
                  </div>
                </li>
              </ul>
            </div>

            {/* 자주 묻는 질문 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">자주 묻는 질문</h2>
              <div className="space-y-3 text-sm">
                <button className="w-full text-left p-2 hover:bg-gray-50 rounded">
                  MPW shuttle 일정은 어떻게 확인하나요?
                </button>
                <button className="w-full text-left p-2 hover:bg-gray-50 rounded">
                  PDK는 어떻게 받을 수 있나요?
                </button>
                <button className="w-full text-left p-2 hover:bg-gray-50 rounded">
                  견적은 어떻게 요청하나요?
                </button>
                <button className="w-full text-left p-2 hover:bg-gray-50 rounded">
                  외주 서비스 절차가 궁금합니다
                </button>
              </div>
            </div>
          </div>

          {/* 우측 채팅 영역 */}
          <div className="lg:col-span-2 h-[600px]">
            <ChatContainer />
          </div>
        </div>
      </div>

      {/* 푸터 */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">YNS</h3>
              <p className="text-sm text-gray-400">
                TSMC Design House 파트너로서 최고의 반도체 설계 서비스를 제공합니다.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">연락처</h3>
              <p className="text-sm text-gray-400">
                이메일: info@yns.com<br />
                전화: 02-1234-5678<br />
                주소: 서울시 강남구
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">업무시간</h3>
              <p className="text-sm text-gray-400">
                평일: 09:00 - 18:00<br />
                토요일: 09:00 - 13:00<br />
                일요일/공휴일: 휴무
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
            © 2024 YNS. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}