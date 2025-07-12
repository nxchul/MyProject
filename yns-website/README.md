# YNS 홈페이지

YNS TSMC Design House를 위한 AI 기반 대화형 홈페이지입니다.

## 🚀 주요 기능

### 1. AI 채팅 인터페이스
- 실시간 Q&A 서비스
- YNS 서비스에 대한 상세한 답변
- 자연스러운 대화형 인터페이스
- 빠른 액션 버튼으로 즉시 질문

### 2. 서비스 정보 제공
- **MPW Shuttle 일정**: Shuttle schedule PDF 제공 및 일정 관리
- **Shuttle 가이드**: Min size, Die #, Wafer delivery 등 가이드문서
- **Process 정보**: 전압, 디바이스 종류 등 프로세스 관련 문서
- **PDK/DK 요청**: NDA 작성, 서류 사인, 개인정보 동의 절차
- **Outsourcing 서비스**: Manual Layout, PNR 인력 구축 및 모집
- **용역비용 산출**: 견적서 요청 및 답변, 계약 관리
- **IP Datasheet**: IP 동작원리 및 시뮬레이션 제공
- **IP Spec 설명**: PLL, POR, PVT, ADC, DAC, LDO 등 용어 설명
- **MPW 일정관리**: TO 전 Dry GDS 요청, GDS Upload, XOR 기능
- **마스크 정보**: 마스크 수 등 정보 고객 전달

## 🛠 기술 스택

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Create React App

## 📦 설치 및 실행

### 필수 요구사항
- Node.js 16.0.0 이상
- npm 8.0.0 이상

### 설치
```bash
# 의존성 설치
npm install
```

### 개발 서버 실행
```bash
# 개발 모드로 실행
npm start
```

### 빌드
```bash
# 프로덕션 빌드
npm run build
```

## 📁 프로젝트 구조

```
src/
├── components/
│   ├── Header.tsx          # 헤더 컴포넌트
│   ├── Services.tsx        # 서비스 정보 컴포넌트
│   ├── ChatInterface.tsx   # AI 채팅 인터페이스
│   ├── QuickActions.tsx    # 빠른 액션 버튼들
│   └── Footer.tsx          # 푸터 컴포넌트
├── App.tsx                 # 메인 앱 컴포넌트
├── index.tsx              # 앱 진입점
└── index.css              # 글로벌 스타일
```

## 🎯 주요 컴포넌트

### ChatInterface
- 실시간 AI 채팅 기능
- 메시지 히스토리 관리
- 로딩 상태 표시
- 자동 스크롤 기능
- 빠른 액션 버튼 통합

### Services
- YNS 서비스 목록 표시
- 각 서비스별 상세 설명
- 아이콘과 색상으로 구분
- 호버 효과

### Header
- 회사 로고 및 브랜딩
- 네비게이션 메뉴
- 반응형 디자인

### QuickActions
- 자주 묻는 질문 버튼
- 원클릭 질문 기능
- 카테고리별 구분

### Footer
- 회사 정보 및 연락처
- 서비스 링크
- 법적 정보

## 🎨 UI/UX 특징

- **모던한 디자인**: 깔끔하고 전문적인 인터페이스
- **반응형 레이아웃**: 모바일, 태블릿, 데스크톱 지원
- **직관적인 네비게이션**: 사용자 친화적인 메뉴 구조
- **부드러운 애니메이션**: 호버 효과 및 전환 애니메이션
- **접근성 고려**: 스크린 리더 지원 및 키보드 네비게이션

## 🔮 향후 개발 계획

1. **실제 AI API 연동**: 현재 시뮬레이션된 응답을 실제 AI 서비스로 교체
2. **사용자 인증**: 로그인/회원가입 기능 추가
3. **파일 업로드**: NDA 서류 업로드 기능
4. **실시간 알림**: 새로운 메시지 알림 기능
5. **다국어 지원**: 영어/한국어 언어 전환
6. **모바일 최적화**: 모바일 앱 개발
7. **데이터베이스 연동**: 사용자 데이터 및 대화 기록 저장
8. **관리자 패널**: 서비스 관리 및 통계 대시보드

## 🚀 배포

### 정적 호스팅
```bash
# 빌드 생성
npm run build

# 정적 서버로 테스트
npx serve -s build
```

### Docker 배포
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 라이선스

이 프로젝트는 YNS 내부 사용을 위한 프로젝트입니다.

## 📞 문의

YNS TSMC Design House 관련 문의사항은 채팅 인터페이스를 통해 문의해주세요.

---

**YNS** - TSMC Design House의 신뢰할 수 있는 파트너
