# YNS ASIC Design House Platform - PRD

## 1. 제품 개요

### 1.1 제품명
YNS ASIC Design House Platform

### 1.2 제품 목적
YNS ASIC Design House를 위한 통합 AI 기반 플랫폼으로, 반도체 설계 및 제조 관련 서비스를 제공하는 웹 애플리케이션입니다.

### 1.3 비즈니스 목표
- 고객 서비스 효율성 향상
- 반도체 설계 프로세스 자동화
- MPW 및 PDK 관리 체계화
- AI 기반 고객 지원 서비스 제공

### 1.4 타겟 사용자
- **주요 사용자**: 반도체 설계 엔지니어, 연구원, 제조업체
- **보조 사용자**: YNS 내부 직원, 관리자

## 2. 제품 아키텍처

### 2.1 전체 구조
```
YNS Platform
├── yns-website (React 기반 마케팅 사이트)
├── yns-web (Next.js 기반 메인 플랫폼)
└── 공통 리소스 (문서, 설정 파일)
```

### 2.2 기술 스택

#### Frontend
- **yns-website**: React 19, TypeScript, Tailwind CSS
- **yns-web**: Next.js 15, React 19, TypeScript, Tailwind CSS

#### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT, LangChain

#### Infrastructure
- **Deployment**: Vercel
- **Email**: Nodemailer
- **File Processing**: PDF-parse

## 3. 핵심 기능 명세

### 3.1 AI 채팅 인터페이스
**목적**: 실시간 고객 지원 및 기술 문의 응답

**주요 기능**:
- 실시간 Q&A 서비스(카톡 친구 추가)
- YNS 서비스 관련 상세 답변
- 자연어 처리 기반 대화(ChatGPT MCP service)
- 메시지 히스토리 관리
- 로딩 상태 및 에러 처리

**기술 구현**:
- OpenAI GPT API 연동
- LangChain을 통한 RAG (Retrieval-Augmented Generation)
- Supabase를 통한 채팅 히스토리 저장

### 3.2 MPW (Multi-Project Wafer) 관리
**목적**: MPW Shuttle 일정 및 프로젝트 관리

**주요 기능**:
- MPW Shuttle 일정 관리
- Shuttle schedule PDF 제공
- 프로젝트별 상태 추적(DryGDS Request Alarm, Final GDS Request alarm)
- GDS 파일 업로드 및 XOR 검증
- 마스크 정보 관리

**관리자 기능**:
- MPW 일정 승인/거부
- 프로젝트 상태 모니터링
- 통계 및 리포트 생성

### 3.3 PDK (Process Design Kit) 서비스
**목적**: PDK/DK 요청 및 배포 관리

**주요 기능**:
- PDK 다운로드 요청
- NDA 서류 관리
- 개인정보 동의 절차
- 라이선스 관리

**관리자 기능**:
- NDA 요청 승인/거부
- PDK 배포 관리
- 사용자 권한 관리

### 3.4 서비스 정보 제공
**목적**: YNS 서비스에 대한 종합 정보 제공

**포함 서비스**:
- **Shuttle 가이드**: Min size, Die #, Wafer delivery
- **Process 정보**: 전압, 디바이스 종류
- **Outsourcing 서비스**: Manual Layout, PNR 인력 구축
- **용역비용 산출**: 견적서 요청 및 계약 관리
- **IP Datasheet**: IP 동작원리 및 시뮬레이션
- **IP Spec 설명**: PLL, POR, PVT, ADC, DAC, LDO 등

### 3.5 사용자 인증 및 권한 관리
**목적**: 보안성 있는 사용자 관리

**주요 기능**:
- 회원가입/로그인 (Supabase Auth)
- 역할 기반 접근 제어 (RBAC)
- 관리자 대시보드
- 세션 관리

### 3.6 암호화 계산기
**목적**: 암호화 관련 계산 도구 제공

**주요 기능**:
- 암호화 알고리즘 계산
- 보안 키 생성
- 암호화/복호화 도구

## 4. 사용자 시나리오

### 4.1 신규 사용자
1. 웹사이트 방문 → 서비스 소개 확인
2. 회원가입 → 이메일 인증
3. 로그인 → AI 채팅으로 서비스 문의
4. PDK 요청 → NDA 서명 → 다운로드
5. MPW 참여 신청 → GDS 업로드

### 4.2 기존 사용자
1. 로그인 → 대시보드 확인
2. 진행 중인 프로젝트 상태 확인
3. 새로운 MPW 일정 확인
4. AI 채팅으로 기술 문의
5. 필요시 PDK 추가 요청

### 4.3 관리자
1. 관리자 로그인
2. NDA 요청 승인/거부
3. MPW 일정 관리
4. 사용자 통계 확인
5. 시스템 모니터링

## 5. 기술적 요구사항

### 5.1 성능 요구사항
- 페이지 로딩 시간: 3초 이내
- AI 응답 시간: 10초 이내
- 동시 사용자: 100명 이상
- 파일 업로드: 최대 100MB

### 5.2 보안 요구사항
- HTTPS 통신 필수
- 사용자 데이터 암호화
- 파일 업로드 보안 검증
- API 인증 토큰 관리

### 5.3 호환성 요구사항
- 브라우저: Chrome, Firefox, Safari, Edge 최신 버전
- 모바일: 반응형 디자인 지원
- OS: Windows, macOS, Linux

## 6. 프로젝트 구조

### 6.1 yns-website (React 마케팅 사이트)
```
src/
├── components/
│   ├── Header.tsx          # 헤더 컴포넌트
│   ├── Services.tsx        # 서비스 정보 컴포넌트
│   ├── ChatInterface.tsx   # AI 채팅 인터페이스
│   ├── Footer.tsx          # 푸터 컴포넌트
│   └── QuickActions.tsx    # 빠른 액션 컴포넌트
├── App.tsx                 # 메인 앱 컴포넌트
├── index.tsx              # 앱 진입점
└── index.css              # 글로벌 스타일
```

### 6.2 yns-web (Next.js 메인 플랫폼)
```
src/app/
├── api/                    # API 라우트
│   ├── chat/              # 채팅 API
│   ├── pdk/               # PDK 관련 API
│   └── admin/             # 관리자 API
├── admin/                  # 관리자 페이지
│   ├── mpw/               # MPW 관리
│   └── nda/               # NDA 관리
├── chat/                   # 채팅 페이지
├── mpw/                    # MPW 페이지
├── pdk/                    # PDK 페이지
├── services/               # 서비스 페이지
├── login/                  # 로그인 페이지
└── crypto-calculator/      # 암호화 계산기
```

## 7. 개발 로드맵

### 7.1 Phase 1 (완료)
- ✅ 기본 웹사이트 구조 구축
- ✅ AI 채팅 인터페이스 구현
- ✅ 서비스 정보 페이지 구성
- ✅ 기본 인증 시스템 구축

### 7.2 Phase 2 (진행 중)
- 🔄 MPW 관리 시스템 고도화
- 🔄 PDK 서비스 완성
- 🔄 관리자 대시보드 구축
- 🔄 파일 업로드/다운로드 기능

### 7.3 Phase 3 (계획)
- 📋 실시간 알림 시스템
- 📋 고급 AI 기능 (이미지 분석, 문서 요약)
- 📋 모바일 앱 개발
- 📋 다국어 지원 (영어/한국어)

### 7.4 Phase 4 (향후)
- 📋 API 외부 공개
- 📋 고급 분석 및 리포팅
- 📋 워크플로우 자동화
- 📋 통합 개발 환경 (IDE) 플러그인

## 8. 설치 및 실행

### 8.1 필수 요구사항
- Node.js 18.0.0 이상
- npm 9.0.0 이상
- PostgreSQL 데이터베이스
- OpenAI API 키
- Supabase 프로젝트

### 8.2 환경 설정
```bash
# 환경 변수 설정 (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_database_url
```

### 8.3 설치 및 실행

#### yns-website (React)
```bash
cd yns-website
npm install
npm start
```

#### yns-web (Next.js)
```bash
cd yns-web
npm install
npm run dev
```

### 8.4 빌드
```bash
# React 앱 빌드
cd yns-website
npm run build

# Next.js 앱 빌드
cd yns-web
npm run build
npm start
```

## 9. 모니터링 및 유지보수

### 9.1 로깅
- 사용자 활동 로그
- API 호출 로그
- 에러 로그 및 예외 처리

### 9.2 성능 모니터링
- 페이지 로딩 시간 측정
- API 응답 시간 추적
- 사용자 경험 메트릭

### 9.3 보안 모니터링
- 로그인 시도 추적
- 파일 업로드 보안 검사
- API 접근 패턴 분석

## 10. 라이선스 및 문의

### 10.1 라이선스
이 프로젝트는 YNS 내부 사용을 위한 프로젝트입니다.

### 10.2 문의
YNS TSMC Design House 관련 문의사항은 채팅 인터페이스를 통해 문의해주세요.

### 10.3 기술 지원
- 개발팀: dev@yns.co.kr
- 시스템 관리: admin@yns.co.kr
- 일반 문의: info@yns.co.kr 
