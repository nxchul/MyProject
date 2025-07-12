import { KnowledgeItem } from '../types';

export const knowledgeBase: KnowledgeItem[] = [
  // YNS 소개
  {
    id: 'yns-intro',
    category: 'company',
    question: 'YNS는 어떤 회사인가요?',
    answer: 'YNS는 TSMC Design House 파트너로서 반도체 설계 서비스를 제공하는 전문 기업입니다. MPW (Multi-Project Wafer) 서비스, PDK 제공, 설계 용역 등 다양한 반도체 설계 관련 서비스를 제공합니다.',
    keywords: ['YNS', '회사소개', 'TSMC', 'Design House']
  },
  
  // MPW Shuttle 관련
  {
    id: 'mpw-schedule',
    category: 'mpw',
    question: 'MPW shuttle 일정은 어떻게 확인할 수 있나요?',
    answer: 'MPW shuttle 일정은 분기별로 업데이트되며, 각 공정별 tape-out 날짜와 wafer delivery 일정을 확인하실 수 있습니다. 자세한 일정은 shuttle schedule PDF를 참조해 주세요.',
    keywords: ['MPW', 'shuttle', '일정', 'schedule', 'tape-out']
  },
  {
    id: 'mpw-specs',
    category: 'mpw',
    question: 'MPW의 최소 사이즈와 die 개수는 어떻게 되나요?',
    answer: 'MPW의 최소 die 사이즈는 공정에 따라 다르며, 일반적으로 1mm x 1mm부터 가능합니다. Die 개수는 shuttle 종류에 따라 제한이 있으며, 자세한 사항은 가이드 문서를 확인해 주세요.',
    keywords: ['MPW', 'min size', 'die', '최소 사이즈', 'die count']
  },
  {
    id: 'mpw-delivery',
    category: 'mpw',
    question: 'Wafer delivery는 언제 이루어지나요?',
    answer: 'Wafer delivery는 일반적으로 tape-out 후 12-16주 이내에 이루어집니다. 공정과 shuttle 종류에 따라 기간이 달라질 수 있습니다.',
    keywords: ['wafer', 'delivery', '배송', 'MPW']
  },
  
  // Process 관련
  {
    id: 'process-voltage',
    category: 'process',
    question: '공정별 전압은 어떻게 되나요?',
    answer: '공정별 전압은 다음과 같습니다:\n- 28nm: Core 0.9V, I/O 1.8V/2.5V\n- 40nm: Core 1.1V, I/O 1.8V/2.5V/3.3V\n- 65nm: Core 1.2V, I/O 1.8V/2.5V/3.3V\n자세한 사항은 process 문서를 참조해 주세요.',
    keywords: ['전압', 'voltage', 'process', '공정']
  },
  {
    id: 'process-devices',
    category: 'process',
    question: '지원되는 디바이스 종류는 무엇인가요?',
    answer: '각 공정별로 다양한 디바이스를 지원합니다:\n- Standard Cell\n- SRAM\n- ROM\n- I/O Cell\n- Analog Components (Resistor, Capacitor, Inductor)\n- Special Devices (ESD, Fuse 등)',
    keywords: ['디바이스', 'device', 'component', '소자']
  },
  
  // PDK/DK 관련
  {
    id: 'pdk-request',
    category: 'pdk',
    question: 'PDK/DK는 어떻게 요청하나요?',
    answer: 'PDK/DK 요청 절차:\n1. NDA 작성 및 서명 (온라인)\n2. 서명된 문서 인쇄 및 업로드\n3. 개인정보 동의 및 연락처 정보 제공\n4. 승인 후 다운로드 링크 제공',
    keywords: ['PDK', 'DK', '요청', 'request', 'NDA']
  },
  
  // Outsourcing 관련
  {
    id: 'outsourcing-manual',
    category: 'outsourcing',
    question: 'Manual layout 외주는 가능한가요?',
    answer: '네, manual layout 외주 서비스를 제공합니다. 숙련된 layout 엔지니어 팀이 있으며, 프로젝트 규모에 따라 인력을 배치합니다. 작업 공간과 필요한 권한을 제공해 드립니다.',
    keywords: ['manual layout', '외주', 'outsourcing', 'layout']
  },
  {
    id: 'outsourcing-pnr',
    category: 'outsourcing',
    question: 'P&R (Place and Route) 서비스도 제공하나요?',
    answer: '네, P&R 서비스도 제공합니다. 경험이 풍부한 P&R 엔지니어들이 디지털 설계의 physical implementation을 지원합니다. 프로젝트에 맞는 인력 구성과 작업 환경을 제공합니다.',
    keywords: ['P&R', 'PnR', 'Place and Route', '외주']
  },
  
  // 비용 관련
  {
    id: 'cost-estimation',
    category: 'cost',
    question: '용역 비용은 어떻게 산출되나요?',
    answer: '용역 비용은 다음 요소들을 고려하여 산출됩니다:\n- 프로젝트 복잡도\n- 작업 기간\n- 필요 인력 수\n- 사용 공정\n- 추가 서비스 요구사항\n구체적인 견적은 프로젝트 상담 후 제공됩니다.',
    keywords: ['비용', '견적', 'cost', 'estimation', '용역비']
  },
  
  // Basic Service - IP 관련
  {
    id: 'ip-datasheet',
    category: 'ip',
    question: 'IP datasheet는 제공되나요?',
    answer: '네, 모든 IP에 대한 상세한 datasheet를 제공합니다. Datasheet에는 기능 설명, 핀 설명, 타이밍 다이어그램, 응용 회로 등이 포함됩니다.',
    keywords: ['IP', 'datasheet', '데이터시트']
  },
  {
    id: 'ip-simulation',
    category: 'ip',
    question: 'IP 동작 시뮬레이션도 지원하나요?',
    answer: '네, 다양한 IP에 대한 동작 원리 설명과 시뮬레이션을 지원합니다:\n- PLL (Phase-Locked Loop)\n- POR (Power-On Reset)\n- PVT (Process, Voltage, Temperature) Monitor\n- ADC/DAC\n- LDO (Low Drop-Out Regulator)',
    keywords: ['IP', '시뮬레이션', 'simulation', 'PLL', 'POR', 'PVT', 'ADC', 'DAC', 'LDO']
  },
  {
    id: 'ip-terms',
    category: 'ip',
    question: 'IP spec의 용어가 이해가 안 갑니다. 설명을 받을 수 있나요?',
    answer: '네, IP specification에 사용되는 전문 용어들에 대한 상세한 설명을 제공합니다. 이해가 어려운 용어나 개념이 있으시면 언제든지 문의해 주세요.',
    keywords: ['IP', 'spec', '용어', 'terminology', '설명']
  },
  
  // 계약 관리
  {
    id: 'contract-quote',
    category: 'contract',
    question: '견적서는 어떻게 요청하나요?',
    answer: '견적서 요청은 다음 정보와 함께 문의해 주세요:\n- 프로젝트 개요\n- 사용 예정 공정\n- 예상 일정\n- 필요 서비스 항목\n빠른 시일 내에 상세 견적서를 제공해 드립니다.',
    keywords: ['견적서', 'quote', '계약', 'contract']
  },
  
  // MPW 일정 관리
  {
    id: 'mpw-gds',
    category: 'mpw-management',
    question: 'Tape-out 전 GDS 제출은 어떻게 하나요?',
    answer: 'Tape-out 전 dry run GDS 제출 절차:\n1. Tape-out 2주 전까지 GDS 파일 준비\n2. 전용 포털을 통해 GDS 업로드\n3. DRC/LVS 검증 수행\n4. XOR 기능을 통한 변경사항 확인\n5. 최종 마스크 수 등 정보 확인',
    keywords: ['GDS', 'tape-out', 'dry run', 'upload', 'XOR']
  }
];

// 카테고리별 분류
export const categories = {
  company: 'YNS 소개',
  mpw: 'MPW Shuttle',
  process: 'Process 정보',
  pdk: 'PDK/DK',
  outsourcing: '외주 서비스',
  cost: '비용',
  ip: 'IP 서비스',
  contract: '계약 관리',
  'mpw-management': 'MPW 일정 관리'
};

// 키워드 검색 함수
export function searchKnowledge(query: string): KnowledgeItem[] {
  const lowerQuery = query.toLowerCase();
  
  return knowledgeBase.filter(item => {
    // 질문이나 답변에 검색어가 포함되어 있는지 확인
    const inQuestion = item.question.toLowerCase().includes(lowerQuery);
    const inAnswer = item.answer.toLowerCase().includes(lowerQuery);
    
    // 키워드에 검색어가 포함되어 있는지 확인
    const inKeywords = item.keywords.some(keyword => 
      keyword.toLowerCase().includes(lowerQuery)
    );
    
    return inQuestion || inAnswer || inKeywords;
  });
}

// 카테고리별 지식 가져오기
export function getKnowledgeByCategory(categoryId: string): KnowledgeItem[] {
  return knowledgeBase.filter(item => item.category === categoryId);
}