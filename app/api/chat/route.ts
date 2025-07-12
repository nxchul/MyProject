import { NextRequest, NextResponse } from 'next/server';
import { searchKnowledge } from '../../../data/knowledge-base';
import { Message } from '../../../types';

// AI 응답 생성 함수 (실제로는 OpenAI API를 사용할 수 있음)
async function generateAIResponse(userMessage: string): Promise<string> {
  // 지식 베이스에서 관련 정보 검색
  const relevantKnowledge = searchKnowledge(userMessage);
  
  if (relevantKnowledge.length > 0) {
    // 가장 관련성 높은 답변 반환
    const bestMatch = relevantKnowledge[0];
    return bestMatch.answer;
  }
  
  // 기본 응답
  const defaultResponses: { [key: string]: string } = {
    인사: '안녕하세요! YNS에 오신 것을 환영합니다. TSMC Design House 서비스에 대해 무엇을 도와드릴까요?',
    감사: '도움이 되었다니 기쁩니다! 추가로 궁금하신 사항이 있으시면 언제든지 문의해 주세요.',
    기타: '죄송합니다. 해당 질문에 대한 정확한 답변을 찾지 못했습니다. 다음 중 어떤 서비스에 대해 알고 싶으신가요?\n\n• MPW Shuttle 서비스\n• Process 정보\n• PDK/DK 요청\n• 외주 서비스 (Layout, P&R)\n• IP 서비스\n• 견적 문의\n\n구체적인 질문을 해주시면 더 정확한 답변을 드릴 수 있습니다.',
  };
  
  // 간단한 키워드 매칭
  if (userMessage.includes('안녕') || userMessage.includes('hello')) {
    return defaultResponses.인사;
  } else if (userMessage.includes('감사') || userMessage.includes('고맙')) {
    return defaultResponses.감사;
  }
  
  return defaultResponses.기타;
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      );
    }
    
    // AI 응답 생성
    const aiResponse = await generateAIResponse(message);
    
    // 응답 메시지 생성
    const responseMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    };
    
    return NextResponse.json({ message: responseMessage });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}