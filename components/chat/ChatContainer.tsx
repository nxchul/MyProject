'use client';

import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../../lib/store/chat-store';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Message } from '../../types';
import axios from 'axios';

export const ChatContainer: React.FC = () => {
  const { currentSession, isLoading, addMessage, setLoading, createNewSession } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);
  
  // 세션이 없으면 생성
  useEffect(() => {
    if (!currentSession) {
      createNewSession();
    }
  }, [currentSession, createNewSession]);
  
  const handleSendMessage = async (messageText: string) => {
    // 사용자 메시지 추가
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };
    
    addMessage(userMessage);
    setLoading(true);
    
    try {
      // API 호출
      const response = await axios.post('/api/chat', {
        message: messageText,
      });
      
      // AI 응답 추가
      if (response.data.message) {
        addMessage(response.data.message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // 오류 메시지 추가
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* 헤더 */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-bold">YNS AI Assistant</h2>
        <p className="text-sm opacity-90">TSMC Design House 서비스에 대해 무엇이든 물어보세요</p>
      </div>
      
      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto">
        {currentSession?.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="mb-2">안녕하세요! 무엇을 도와드릴까요?</p>
              <p className="text-sm">MPW, PDK, 외주 서비스 등에 대해 문의해 주세요.</p>
            </div>
          </div>
        ) : (
          <>
            {currentSession?.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex gap-3 p-4 bg-white">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <div className="animate-pulse w-4 h-4 bg-white rounded-full"></div>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm mb-1">YNS AI Assistant</div>
                  <div className="text-gray-500">답변을 생성 중입니다...</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* 입력 영역 */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
};