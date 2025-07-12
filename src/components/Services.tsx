import React from 'react';
import { 
  FileText, 
  Download, 
  Settings, 
  Users, 
  Calculator, 
  Clock, 
  Shield,
  Database,
  Code,
  BarChart3
} from 'lucide-react';

const Services: React.FC = () => {
  const services = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: "MPW Shuttle 일정",
      description: "Shuttle schedule PDF 제공 및 일정 관리",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: "Shuttle 가이드",
      description: "Min size, Die #, Wafer delivery 등 가이드문서",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: "Process 정보",
      description: "전압, 디바이스 종류 등 프로세스 관련 문서",
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "PDK/DK 요청",
      description: "NDA 작성, 서류 사인, 개인정보 동의 절차",
      color: "bg-red-100 text-red-600"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Outsourcing 서비스",
      description: "Manual Layout, PNR 인력 구축 및 모집",
      color: "bg-yellow-100 text-yellow-600"
    },
    {
      icon: <Calculator className="w-6 h-6" />,
      title: "용역비용 산출",
      description: "견적서 요청 및 답변, 계약 관리",
      color: "bg-indigo-100 text-indigo-600"
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "IP Datasheet",
      description: "IP 동작원리 및 시뮬레이션 제공",
      color: "bg-pink-100 text-pink-600"
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: "IP Spec 설명",
      description: "PLL, POR, PVT, ADC, DAC, LDO 등 용어 설명",
      color: "bg-orange-100 text-orange-600"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "MPW 일정관리",
      description: "TO 전 Dry GDS 요청, GDS Upload, XOR 기능",
      color: "bg-teal-100 text-teal-600"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "마스크 정보",
      description: "마스크 수 등 정보 고객 전달",
      color: "bg-cyan-100 text-cyan-600"
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">YNS 서비스</h2>
      
      <div className="space-y-4">
        {services.map((service, index) => (
          <div 
            key={index}
            className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className={`p-2 rounded-lg ${service.color}`}>
              {service.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">
                {service.title}
              </h3>
              <p className="text-gray-600 text-xs mt-1">
                {service.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">AI 어시스턴트</h3>
        <p className="text-blue-700 text-sm">
          오른쪽 채팅창에서 YNS 서비스에 대한 질문을 자유롭게 해주세요.
          AI가 실시간으로 답변해드립니다.
        </p>
      </div>
    </div>
  );
};

export default Services;