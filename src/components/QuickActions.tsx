import React from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Calculator, 
  Users, 
  Shield,
  Database,
  Clock
} from 'lucide-react';

interface QuickAction {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: () => void;
  color: string;
}

interface QuickActionsProps {
  onActionClick: (action: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onActionClick }) => {
  const quickActions: QuickAction[] = [
    {
      icon: <FileText className="w-5 h-5" />,
      title: "MPW 일정 확인",
      description: "최신 Shuttle 일정을 확인하세요",
      action: () => onActionClick("MPW 일정을 확인하고 싶습니다."),
      color: "bg-blue-100 text-blue-600 hover:bg-blue-200"
    },
    {
      icon: <Download className="w-5 h-5" />,
      title: "가이드 문서",
      description: "Shuttle 가이드 문서를 다운로드하세요",
      action: () => onActionClick("Shuttle 가이드 문서를 받고 싶습니다."),
      color: "bg-green-100 text-green-600 hover:bg-green-200"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "NDA 요청",
      description: "PDK/DK 요청을 위한 NDA 절차",
      action: () => onActionClick("PDK/DK 요청 절차를 알려주세요."),
      color: "bg-red-100 text-red-600 hover:bg-red-200"
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Outsourcing",
      description: "Manual Layout, PNR 서비스 문의",
      action: () => onActionClick("Outsourcing 서비스에 대해 문의하고 싶습니다."),
      color: "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
    },
    {
      icon: <Calculator className="w-5 h-5" />,
      title: "견적 요청",
      description: "용역비용 견적을 요청하세요",
      action: () => onActionClick("용역비용 견적을 받고 싶습니다."),
      color: "bg-purple-100 text-purple-600 hover:bg-purple-200"
    },
    {
      icon: <Database className="w-5 h-5" />,
      title: "IP 정보",
      description: "IP Datasheet 및 동작원리",
      action: () => onActionClick("IP Datasheet와 동작원리에 대해 알려주세요."),
      color: "bg-pink-100 text-pink-600 hover:bg-pink-200"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "일정 관리",
      description: "MPW 일정관리 및 GDS 업로드",
      action: () => onActionClick("MPW 일정관리와 GDS 업로드 절차를 알려주세요."),
      color: "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 액션</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className={`p-3 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 ${action.color}`}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {action.icon}
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs opacity-75">{action.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;