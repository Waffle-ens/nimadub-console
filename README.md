# Nimadub

AI 주도 개발 운영을 위한 **태스크 · 의사결정 · 승인 · 감사 로그 통합 콘솔**입니다.

Nimadub은 Slack, Notion, GitHub Projects를 각각 사용하는 대신,
AI 개발 운영에 필요한 핵심 기능을 하나의 내부용 웹 애플리케이션으로 통합하는 것을 목표로 합니다.

> GitHub는 코드 저장소 및 PR/이슈 연결 용도로 사용하고,
> 작업 관리, 대화 기록, 문서, 승인, 메모리 스냅샷, 감사 로그는 Nimadub 내부에서 관리합니다.

---

## 목차

* [개요](#개요)
* [주요 기능](#주요-기능)
* [기술 스택](#기술-스택)
* [API 엔드포인트](#api-엔드포인트)
* [주요 화면](#주요-화면)
* [로컬 실행 방법](#로컬-실행-방법)
* [데이터베이스](#데이터베이스)
* [감사 로그 정책](#감사-로그-정책)
* [향후 확장 계획](#향후-확장-계획)
* [PostgreSQL 전환 가이드](#postgresql-전환-가이드)
* [개발 규칙](#개발-규칙)
* [주의사항](#주의사항)
* [라이선스](#라이선스)

---

## 개요

Nimadub은 **AI 주도 개발 운영**을 위한 내부용 MVP입니다.

이 시스템은 다음 요소를 하나의 콘솔에서 통합 관리합니다.

* 프로젝트 관리
* 태스크 상태 추적
* 작업별 메시지 스레드
* 의사결정 기록
* 문서 관리
* 승인 요청 및 처리
* 메모리 스냅샷
* 감사 로그
* GitHub 이슈 / PR 링크

이 프로젝트의 목적은 모든 협업 툴을 완전히 대체하는 것이 아니라,
**AI 주도 개발 워크플로에 필요한 핵심 기능만 집중적으로 제공하는 운영 콘솔**을 만드는 것입니다.

---

## 주요 기능

### 프로젝트 관리

* 프로젝트 생성 및 조회
* 프로젝트 목표, MVP 범위, 금지사항 관리
* GitHub 저장소 정보 연결

### 태스크 보드

* Kanban 방식의 태스크 관리
* 지원 상태:

  * `BACKLOG`
  * `READY`
  * `IN_PROGRESS`
  * `REVIEW`
  * `QA`
  * `STAGING`
  * `DONE`
  * `BLOCKED`

### 작업별 메시지 스레드

* 태스크 단위 대화 기록
* 사람과 AI 에이전트의 작업 맥락 보존

### 의사결정 기록

* 결정 내용, 근거, 영향 범위 저장
* 승인 필요 여부 추적

### 문서 관리

지원 문서 유형:

* `CONSTITUTION`
* `PRD`
* `ADR`
* `RELEASE_CHECKLIST`
* `RETROSPECTIVE`
* `OTHER`

### 승인 요청

* 승인 요청 생성 및 처리
* 지원 상태:

  * `PENDING`
  * `APPROVED`
  * `REJECTED`

### 메모리 스냅샷

지원 메모리 유형:

* `CONSTITUTION`
* `SPRINT`
* `TASK`
* `RESET_SUMMARY`

### 감사 로그

* 주요 변경 사항 자동 기록
* 상태 변경 및 승인 이력 추적

### GitHub 링크 관리

* 이슈, PR, 커밋 링크 저장 및 조회

---

## 기술 스택

* **Frontend**: Next.js 14, TypeScript, React 18
* **API**: Next.js API Routes
* **Database**: SQLite
* **ORM**: Prisma 5
* **UI**: Tailwind CSS
* **인증**: MVP 수준의 간단한 패스워드 기반 인증

### SQLite를 사용한 이유

초기 MVP는 별도 DB 서버 없이 바로 실행할 수 있어야 하므로 SQLite를 사용했습니다.

기본 실행 순서는 다음과 같습니다.

1. `npm install`
2. `npx prisma migrate dev --name init`
3. `npm run dev`

---

## API 엔드포인트

### Projects

* `GET /api/projects` — 프로젝트 목록 조회
* `POST /api/projects` — 프로젝트 생성
* `GET /api/projects/[id]` — 프로젝트 상세 조회
* `PUT /api/projects/[id]` — 프로젝트 수정
* `DELETE /api/projects/[id]` — 프로젝트 삭제

### Tasks

* `GET /api/tasks?projectId=` — 프로젝트별 태스크 목록 조회
* `POST /api/tasks` — 태스크 생성
* `GET /api/tasks/[id]` — 태스크 상세 조회
* `PUT /api/tasks/[id]` — 태스크 수정 및 상태 변경
* `DELETE /api/tasks/[id]` — 태스크 삭제

### 태스크 하위 리소스

* `/api/tasks/[id]/messages` — 메시지 목록 조회 / 등록
* `/api/tasks/[id]/decisions` — 의사결정 목록 조회 / 등록
* `/api/tasks/[id]/approvals` — 승인 목록 조회 / 요청 생성
* `/api/tasks/[id]/memory-snapshots` — 메모리 스냅샷 목록 조회 / 생성
* `/api/tasks/[id]/github-links` — GitHub 링크 목록 조회 / 생성

### 공통 리소스

* `GET /api/approvals/[id]` — 승인 상세 조회
* `PUT /api/approvals/[id]` — 승인 상태 변경
* `GET /api/documents` — 문서 목록 조회
* `POST /api/documents` — 문서 생성
* `PUT /api/documents/[id]` — 문서 수정
* `DELETE /api/documents/[id]` — 문서 삭제
* `GET /api/audit-logs?taskId=&entity=` — 감사 로그 조회

---

## 주요 화면

### `/projects`

* 프로젝트 목록
* 프로젝트 생성 폼

### `/projects/[id]`

* Kanban 보드
* 상태별 태스크 목록
* 태스크 생성 폼

### `/projects/[id]/tasks/[taskId]`

태스크 상세 화면

포함 섹션:

* **Overview**

  * 제목
  * 설명
  * 수용 기준
  * 상태 변경

* **Messages**

  * 메시지 스레드

* **Decisions**

  * 의사결정 목록 및 등록

* **Documents**

  * 연결된 문서 목록

* **Approvals**

  * 승인 요청 및 승인 처리

* **Memory**

  * 메모리 스냅샷 조회

* **Audit**

  * 감사 로그 조회

### `/documents`

* 전체 문서 목록
* 문서 유형별 필터

### `/approvals`

* 승인 대기 목록

### `/audit-logs`

* 전체 감사 로그
* 엔터티 기준 필터

---

## 로컬 실행 방법

### 1. 의존성 설치

```bash id="7a9j8j"
npm install
```

### 2. 데이터베이스 마이그레이션 실행

```bash id="eod8jq"
npx prisma migrate dev --name init
```

이 단계에서 다음 항목이 자동으로 준비됩니다.

* SQLite 데이터베이스 파일 생성
* Prisma 마이그레이션 반영
* 초기 스키마 적용

### 3. 개발 서버 실행

```bash id="f7m4sg"
npm run dev
```

기본 실행 주소:

* `http://localhost:3000`

### 4. 프로덕션 빌드

```bash id="9hmo3e"
npm run build
npm start
```

### 5. Prisma Studio 실행

```bash id="2mvi7l"
npx prisma studio
```

기본 실행 주소:

* `http://localhost:5555`

---

## 데이터베이스

현재 MVP는 SQLite 기반으로 동작합니다.

* 데이터베이스 파일: `prisma/dev.db`
* 마이그레이션 파일: `prisma/migrations/`

SQLite를 선택한 이유는 다음과 같습니다.

* 설정이 간단함
* 로컬 실행에 적합함
* MVP를 빠르게 검증하기 좋음

---

## 감사 로그 정책

주요 `CREATE`, `UPDATE`, `DELETE` 작업은 감사 로그로 자동 기록됩니다.

### 기록 대상 엔터티

* `Task`
* `Approval`
* `Decision`
* `Document`
* `TaskMessage`
* `MemorySnapshot`
* `GithubLink`

### 기록 항목

* `entity`
* `action`
* `before`
* `after`
* `actor`
* `createdAt`

### 액션 유형 예시

* `CREATE`
* `UPDATE`
* `STATUS_CHANGE`
* `DELETE`

이를 통해 다음과 같은 추적이 가능합니다.

* 누가 태스크 상태를 변경했는지
* 어떤 승인 요청이 반려되었는지
* 어떤 문서가 수정되었는지
* 어떤 변경이 언제 발생했는지

---

## 향후 확장 계획

### 인증 확장

* NextAuth.js
* GitHub / Google OAuth 로그인

### 실시간 기능

* Server-Sent Events (SSE)
* WebSocket 기반 실시간 반영

### GitHub 연동 확장

* GitHub REST API 연동
* 이슈 / PR 동기화
* webhook 기반 자동화

### 알림 기능

* 이메일 알림
* Slack 웹훅 알림

### 권한 관리

* 역할 기반 접근 제어(RBAC)
* `admin / reviewer / developer`

### 배포 및 운영 확장

* Vercel 배포
* PostgreSQL 전환
* 운영 환경 분리

---

## PostgreSQL 전환 가이드

추후 프로덕션 환경에서는 SQLite 대신 PostgreSQL로 전환할 수 있습니다.

### 1. `schema.prisma`의 datasource 변경

```prisma id="bffx9u"
provider = "postgresql"
url      = env("DATABASE_URL")
```

### 2. 환경 변수 설정

```env id="2rgtkh"
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME"
```

### 3. 마이그레이션 반영

```bash id="zmx1nn"
npx prisma migrate deploy
```

---

## 개발 규칙

* TypeScript strict mode 사용
* API 응답 형식 통일
  `{ success: boolean, data?: T, error?: string }`
* 데이터베이스 모델명은 단수형 PascalCase 사용
* API route는 resource 중심으로 설계
* 파일명은 kebab-case 사용
* 상태값은 enum 또는 상수로 관리
* 감사 로그는 주요 변경에 대해 before / after를 기록

---

## 주의사항

* `.env.local` 파일은 저장소에 커밋하지 않습니다.
* Prisma 스키마 변경 후에는 마이그레이션을 다시 실행해야 합니다.
* API 응답 타입은 명시적으로 선언하는 것을 권장합니다.
* 상태 문자열을 직접 하드코딩하지 않는 것을 권장합니다.
* 감사 로그는 데이터가 누적되므로 향후 아카이빙 전략이 필요합니다.

---

## 라이선스

이 저장소는 `LICENSE` 파일의 내용을 따릅니다.
