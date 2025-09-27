# YNS 통합 플랫폼 - PRD (Product Requirements Document)

## 1. 제품 개요

### 1.1 제품명
**YNS 통합 플랫폼** - TSMC Design House를 위한 AI 기반 종합 서비스 플랫폼

### 1.2 제품 비전
반도체 설계 및 제조 서비스 분야의 디지털 혁신을 통해 고객 경험을 극대화하고, AI 기반 자동화로 업무 효율성을 향상시키는 원스톱 플랫폼 구축

### 1.3 제품 목표
- TSMC Design House 서비스의 디지털화 및 자동화
- AI 채팅봇을 통한 24/7 고객 지원 서비스 제공
- MPW(Multi-Project Wafer) 프로세스의 효율적 관리
- 암호화폐 투자 도구 및 금융 계산기 서비스 확장

## 2. 타겟 사용자

### 2.1 주요 사용자 그룹
- **반도체 설계 엔지니어**: MPW 서비스, PDK/DK 요청, 프로세스 정보 조회
- **프로젝트 매니저**: 일정 관리, 비용 산출, 진행 상황 모니터링
- **영업 및 고객 지원팀**: 고객 문의 응답, 견적서 작성, 계약 관리
- **암호화폐 투자자**: 평단가 계산, 투자 분석 도구 활용

### 2.2 사용자 페르소나
- **김설계 (반도체 설계 엔지니어, 32세)**: 빠른 정보 접근과 정확한 기술 문서 필요
- **박매니저 (프로젝트 매니저, 38세)**: 실시간 일정 관리와 비용 추적 기능 필요
- **이영업 (영업 담당자, 29세)**: 고객 응대를 위한 즉시 답변 시스템 필요

## 3. 핵심 기능 요구사항

### 3.1 AI 채팅 인터페이스 (Priority: High)
**기능 설명**: OpenAI 기반 실시간 Q&A 서비스
- 자연어 처리를 통한 기술 문의 응답
- 컨텍스트 기반 대화 연속성 유지
- 다국어 지원 (한국어/영어)
- 메시지 히스토리 저장 및 검색

**기술 요구사항**:
- OpenAI GPT-4 API 연동
- RAG (Retrieval-Augmented Generation) 시스템
- 실시간 스트리밍 응답
- 세션 관리 및 대화 컨텍스트 유지

### 3.2 MPW 서비스 관리 (Priority: High)
**기능 설명**: Multi-Project Wafer 전체 라이프사이클 관리
- **Shuttle 일정 관리**: PDF 스케줄 업로드 및 자동 파싱
- **GDS 파일 관리**: 업로드, 검증, XOR 기능
- **TO(Tape-Out) 관리**: Dry GDS 요청 및 승인 프로세스
- **마스크 정보 관리**: 마스크 수, 레이어 정보 추적

**기술 요구사항**:
- PDF 파싱 라이브러리 (pdf-parse)
- 파일 업로드/다운로드 시스템
- 데이터베이스 스키마 설계
- 자동화된 검증 시스템

### 3.3 PDK/DK 요청 시스템 (Priority: Medium)
**기능 설명**: Process Design Kit 및 Design Kit 요청 자동화
- NDA 작성 및 전자 서명
- 개인정보 동의 절차
- 승인 워크플로우
- 자동 이메일 알림

**기술 요구사항**:
- 전자 서명 시스템 연동
- 이메일 서비스 (Nodemailer)
- 워크플로우 엔진
- 문서 템플릿 관리

### 3.4 암호화폐 계산기 (Priority: Medium)
**기능 설명**: 투자 분석 및 평단가 계산 도구
- 평단가 하향 계산기
- 포트폴리오 분석
- 수익률 시뮬레이션
- 실시간 가격 데이터 연동

**기술 요구사항**:
- 암호화폐 API 연동
- 복잡한 수학 계산 라이브러리
- 차트 시각화 (Chart.js)
- 데이터 캐싱 시스템

### 3.5 사용자 인증 및 권한 관리 (Priority: High)
**기능 설명**: Supabase 기반 인증 시스템
- 로그인/회원가입
- 역할 기반 접근 제어 (RBAC)
- 관리자 패널
- 감사 로그

**기술 요구사항**:
- Supabase Auth 연동
- JWT 토큰 관리
- 권한 미들웨어
- 보안 정책 적용

## 4. 기술 아키텍처

### 4.1 Frontend 아키텍처
```
yns-website/ (React SPA)
├── 마케팅 홈페이지
├── 서비스 소개
└── 초기 고객 접점

yns-web/ (Next.js App)
├── 메인 애플리케이션
├── AI 채팅 인터페이스
├── MPW 관리 시스템
├── 암호화폐 계산기
└── 관리자 패널
```

### 4.2 기술 스택
**Frontend**:
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Heroicons/Lucide React

**Backend**:
- Next.js API Routes
- Supabase (Database + Auth)
- OpenAI API
- Langchain (RAG)
- Nodemailer (Email)

**DevOps**:
- Vercel (Deployment)
- GitHub Actions (CI/CD)
- ESLint/Prettier (Code Quality)

### 4.3 데이터베이스 스키마
```sql
-- 사용자 관리
users (id, email, role, created_at, updated_at)
user_profiles (user_id, name, company, phone, preferences)

-- MPW 관리
mpw_shuttles (id, name, schedule_pdf, deadline, status)
mpw_projects (id, shuttle_id, user_id, project_name, gds_file)
mpw_submissions (id, project_id, submission_type, status, submitted_at)

-- 채팅 관리
chat_sessions (id, user_id, title, created_at)
chat_messages (id, session_id, role, content, timestamp)

-- PDK/DK 요청
pdk_requests (id, user_id, pdk_type, status, nda_signed, approved_at)

-- 암호화폐 계산
crypto_portfolios (id, user_id, name, created_at)
crypto_transactions (id, portfolio_id, symbol, amount, price, type, date)
```

## 5. 사용자 경험 (UX) 요구사항

### 5.1 UI/UX 디자인 원칙
- **직관성**: 복잡한 반도체 프로세스를 단순하고 이해하기 쉽게 표현
- **효율성**: 최소 클릭으로 원하는 정보에 접근
- **일관성**: 전체 플랫폼에서 통일된 디자인 언어 사용
- **접근성**: WCAG 2.1 AA 레벨 준수

### 5.2 반응형 디자인
- 데스크톱: 1920x1080 기준 최적화
- 태블릿: 768px 이상 대응
- 모바일: 375px 이상 대응

### 5.3 성능 요구사항
- 초기 로딩 시간: 3초 이내
- 채팅 응답 시간: 5초 이내
- Core Web Vitals 점수: 90점 이상

## 6. 비기능적 요구사항

### 6.1 보안 요구사항
- HTTPS 강제 적용
- JWT 토큰 기반 인증
- API Rate Limiting
- 개인정보 암호화 저장
- GDPR/CCPA 준수

### 6.2 확장성 요구사항
- 동시 사용자 1,000명 지원
- 수평적 확장 가능한 아키텍처
- CDN을 통한 전역 콘텐츠 배포
- 자동 스케일링 지원

### 6.3 가용성 요구사항
- 99.9% 업타임 보장
- 자동 백업 시스템
- 장애 복구 시간: 30분 이내
- 모니터링 및 알람 시스템

## 7. 프로젝트 일정

### 7.1 Phase 1 (MVP) - 3개월
- [ ] AI 채팅 인터페이스 구현
- [ ] 기본 사용자 인증 시스템
- [ ] MPW 일정 조회 기능
- [ ] 반응형 웹 디자인

### 7.2 Phase 2 (확장) - 2개월
- [ ] GDS 파일 업로드 시스템
- [ ] PDK/DK 요청 워크플로우
- [ ] 이메일 알림 시스템
- [ ] 관리자 패널

### 7.3 Phase 3 (고도화) - 2개월
- [ ] 암호화폐 계산기 통합
- [ ] 고급 분석 도구
- [ ] 모바일 앱 개발
- [ ] API 문서화 및 SDK 제공

## 8. 성공 지표 (KPI)

### 8.1 사용자 참여도
- 월간 활성 사용자 (MAU): 500+
- 세션당 평균 시간: 10분+
- 채팅 완료율: 85%+

### 8.2 비즈니스 성과
- MPW 프로젝트 처리 시간: 50% 단축
- 고객 문의 응답 시간: 80% 단축
- 사용자 만족도: 4.5/5.0+

### 8.3 기술 성과
- 시스템 가용성: 99.9%+
- 평균 응답 시간: 2초 이내
- 오류율: 0.1% 이하

## 9. 위험 요소 및 대응 방안

### 9.1 기술적 위험
- **AI API 의존성**: OpenAI 대안 모델 준비 (Claude, Gemini)
- **데이터 마이그레이션**: 단계적 마이그레이션 계획 수립
- **성능 병목**: 캐싱 및 최적화 전략 사전 수립

### 9.2 비즈니스 위험
- **사용자 적응**: 충분한 교육 및 지원 자료 제공
- **경쟁사 대응**: 차별화된 기능 및 서비스 개발
- **규제 변화**: 법무팀과 지속적 협의

## 10. 운영 및 유지보수

### 10.1 배포 전략
- Blue-Green 배포 방식
- 단계적 롤아웃 (Canary Release)
- 자동화된 테스트 파이프라인

### 10.2 모니터링
- 실시간 성능 모니터링
- 사용자 행동 분석 (Google Analytics)
- 오류 추적 (Sentry)
- 로그 분석 (LogRocket)

### 10.3 지원 체계
- 24/7 기술 지원
- 사용자 피드백 수집 시스템
- 정기적 업데이트 및 개선

## 11. 프로젝트 구조

```
workspace/
├── yns-website/          # React 마케팅 사이트
│   ├── src/components/   # 재사용 가능한 컴포넌트
│   ├── public/          # 정적 자산
│   └── package.json     # 의존성 관리
├── yns-web/             # Next.js 메인 애플리케이션
│   ├── src/app/         # App Router 페이지
│   ├── src/components/  # 공통 컴포넌트
│   ├── src/lib/         # 유틸리티 및 설정
│   └── scripts/         # 빌드 및 배포 스크립트
├── golf_putting_*       # 골프 관련 분석 도구
└── README.md           # 프로젝트 문서
```

## 12. 개발 환경 설정

### 12.1 필수 요구사항
- Node.js 18.0.0 이상
- npm 9.0.0 이상
- Git 2.30.0 이상

### 12.2 설치 및 실행

#### React 웹사이트 (yns-website)
```bash
cd yns-website
npm install
npm start          # 개발 서버 (포트 3000)
npm run build      # 프로덕션 빌드
```

#### Next.js 애플리케이션 (yns-web)
```bash
cd yns-web
npm install
npm run dev        # 개발 서버 (포트 3001)
npm run build      # 프로덕션 빌드
npm start          # 프로덕션 서버
```

### 12.3 환경 변수 설정
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
SMTP_HOST=your_smtp_host
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

## 13. API 문서

### 13.1 인증 API
```typescript
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/user
```

### 13.2 채팅 API
```typescript
POST /api/chat/message
GET  /api/chat/sessions
POST /api/chat/sessions
DELETE /api/chat/sessions/:id
```

### 13.3 MPW API
```typescript
GET    /api/mpw/shuttles
POST   /api/mpw/shuttles
GET    /api/mpw/projects
POST   /api/mpw/projects
PUT    /api/mpw/projects/:id
DELETE /api/mpw/projects/:id
```

## 14. 테스트 전략

### 14.1 테스트 유형
- **단위 테스트**: Jest + React Testing Library
- **통합 테스트**: Cypress E2E 테스트
- **성능 테스트**: Lighthouse CI
- **보안 테스트**: OWASP ZAP

### 14.2 테스트 커버리지
- 코드 커버리지: 80% 이상
- 핵심 기능 테스트: 100%
- API 엔드포인트 테스트: 100%

## 15. 라이선스 및 법적 고지

이 프로젝트는 YNS 내부 사용을 위한 독점 소프트웨어입니다.
- 모든 코드 및 문서는 YNS의 지적 재산입니다.
- 제3자 라이브러리는 각각의 라이선스를 따릅니다.
- 개인정보 처리방침 및 이용약관 준수

## 16. 문의 및 지원

- **기술 문의**: AI 채팅 인터페이스 활용
- **비즈니스 문의**: contact@yns.co.kr
- **긴급 지원**: 24/7 온콜 지원팀
- **문서 업데이트**: 분기별 정기 업데이트

---

**문서 버전**: v1.0  
**최종 업데이트**: 2025년 9월 27일  
**작성자**: YNS 개발팀  
**승인자**: CTO 
