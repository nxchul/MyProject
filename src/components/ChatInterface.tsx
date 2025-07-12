import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import QuickActions from './QuickActions';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '안녕하세요! YNS AI 어시스턴트입니다. TSMC Design House 서비스에 대해 궁금한 점이 있으시면 언제든 질문해주세요.',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // AI 응답 시뮬레이션 함수
  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // 실제로는 여기에 AI API 호출이 들어갑니다
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const responses = [
      "YNS는 TSMC Design House로서 다양한 서비스를 제공하고 있습니다. 구체적으로 어떤 부분에 대해 궁금하신가요?",
      "MPW Shuttle 일정에 대해 문의하시는군요. 현재 사용 가능한 일정을 확인해드리겠습니다.",
      "PDK/DK 요청 절차는 NDA 작성부터 시작됩니다. 웹에서 서류를 작성하고 사인한 후 업로드해주세요.",
      "Outsourcing 서비스는 Manual Layout과 PNR 작업을 지원합니다. 인력 구축 및 작업 공간 제공이 가능합니다.",
      "IP Datasheet와 동작원리에 대해 설명드리겠습니다. PLL, POR, PVT, ADC, DAC, LDO 등 다양한 IP를 보유하고 있습니다.",
      "용역비용 산출은 프로젝트 규모와 복잡도에 따라 다릅니다. 구체적인 요구사항을 알려주시면 정확한 견적을 제공해드립니다.",
      "MPW 일정관리는 TO 전 Dry GDS 요청부터 시작하여 GDS Upload, XOR 기능까지 지원합니다.",
      "Shuttle 관련 질문이시군요. Min size, Die #, Wafer delivery 등에 대한 가이드문서를 참조해주세요.",
      "Process 정보는 전압, 디바이스 종류 등에 대한 상세한 문서를 제공합니다.",
      "개인정보 동의 및 연락처 등록은 필수 절차입니다. 보안을 위해 안전하게 관리됩니다."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const aiResponse = await generateAIResponse(inputText);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('AI 응답 생성 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (action: string) => {
    setInputText(action);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
      {/* 채팅 헤더 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">YNS AI 어시스턴트</h3>
            <p className="text-sm text-gray-600">실시간으로 답변해드립니다</p>
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className={`text-xs mt-1 ${
                message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">답변을 생성하고 있습니다...</span>
              </div>
            </div>
          </div>
        )}
        
        {/* 빠른 액션 버튼들 */}
        {messages.length === 1 && !isLoading && (
          <QuickActions onActionClick={handleQuickAction} />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="YNS 서비스에 대해 질문해주세요..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Enter로 전송, Shift+Enter로 줄바꿈
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;