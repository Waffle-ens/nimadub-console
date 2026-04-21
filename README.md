# Nimadub - AI-Driven Development Operations Console

내부용 AI 개발 운영 콘솔 MVP입니다. Slack/Notion/GitHub Projects를 대체하지 않고, AI 운영에 필요한 핵심 기능을 통합합니다.

## 주요 기능

- **프로젝트 관리**: 프로젝트 생성 및 조회
- **작업 카드 시스템**: Kanban 보드로 상태 관리 (BACKLOG → READY → IN_PROGRESS → REVIEW → QA → STAGING → DONE, BLOCKED)
- **작업별 메시지 스레드**: 태스크 내 메시지 기록
- **의사결정 기록**: 결정 사항과 근거 저장
- **문서 관리**: 프로젝트/태스크별 문서 (CONSTITUTION, PRD, ADR, RELEASE_CHECKLIST, RETROSPECTIVE, OTHER)
- **승인 요청**: 승인 상태 추적 (PENDING → APPROVED/REJECTED)
- **메모리 스냅샷**: 계층별 메모리 저장 (CONSTITUTION, SPRINT, TASK, RESET_SUMMARY)
- **감사 로그**: 모든 변경 이력 자동 기록
- **GitHub 링크**: 이슈/PR 연결

## 기술 스택

- **Frontend**: Next.js 14 + TypeScript + React 18
- **API**: Next.js API Routes
- **Database**: SQLite (파일 기반 - 별도 설치 불필요)
- **ORM**: Prisma 5
- **UI**: Tailwind CSS (shadcn/ui 컴포넌트 구조)
- **인증**: MVP 수준의 간단한 패스워드 기반

**장점**: npm install → npx prisma migrate dev → npm run dev (3단계로 바로 실행 가능)

## API 엔드포인트

### Projects
- `GET /api/projects` - 프로젝트 목록
- `POST /api/projects` - 생성
- `GET /api/projects/[id]` - 상세 조회
- `PUT /api/projects/[id]` - 수정
- `DELETE /api/projects/[id]` - 삭제

### Tasks
- `GET /api/tasks?projectId=` - 태스크 목록
- `POST /api/tasks` - 생성
- `GET /api/tasks/[id]` - 상세 조회 (전체 relation 포함)
- `PUT /api/tasks/[id]` - 수정 (상태 변경 포함)
- `DELETE /api/tasks/[id]` - 삭제

### Task Sub-Resources
- `/api/tasks/[id]/messages` - 메시지 GET/POST
- `/api/tasks/[id]/decisions` - 의사결정 GET/POST
- `/api/tasks/[id]/approvals` - 승인 GET/POST
- `/api/tasks/[id]/memory-snapshots` - 메모리 GET/POST
- `/api/tasks/[id]/github-links` - GitHub 링크 GET/POST

### Global Resources
- `GET /api/approvals/[id]` - 승인 상세
- `PUT /api/approvals/[id]` - 승인 상태 변경 (APPROVED/REJECTED)
- `GET/POST/PUT/DELETE /api/documents` - 문서 CRUD
- `GET /api/audit-logs?taskId=&entity=` - 감사 로그 조회

## 주요 UI 페이지

1. **/projects** - 프로젝트 카드 목록 + 생성 폼
2. **/projects/[id]** - Kanban 보드 (상태별 컬럼) + 태스크 생성 폼
3. **/projects/[id]/tasks/[taskId]** - 태스크 상세 (탭 구성):
   - Overview: 제목/설명/수용기준/상태 변경
   - Messages: 메시지 스레드
   - Decisions: 의사결정 목록/추가
   - Documents: 연결 문서
   - Approvals: 승인 요청/처리
   - Memory: 메모리 스냅샷 (type별)
   - Audit: 감사 로그
4. **/documents** - 전체 문서 목록 (type 필터)
5. **/approvals** - PENDING 승인 목록
6. **/audit-logs** - 전체 감사 로그 (entity 필터)

## 로컬 실행 방법 (SQLite - 별도 설치 불필요)

### 1. 의존성 설치
```bash
npm install
```

### 2. DB 마이그레이션 (SQLite 자동 생성)
```bash
npx prisma migrate dev --name init
```

**이게 전부입니다!** SQLite는 파일 기반이라 별도 설치/설정이 필요 없습니다.
- 데이터베이스 파일: `prisma/dev.db` (자동 생성)
- 마이그레이션 파일: `prisma/migrations/` (자동 관리)

### 3. 개발 서버 실행
```bash
npm run dev
# → http://localhost:3000
```

### 4. 프로덕션 빌드
```bash
npm run build
npm start
```

### 5. DB 조회 (Prisma Studio)
```bash
npx prisma studio
# → http://localhost:5555
```

## 감사 로그 자동 기록

모든 CREATE/UPDATE/DELETE 작업이 자동으로 감사 로그에 기록됩니다:
- **entity**: Task, Approval, Decision, Document, TaskMessage, MemorySnapshot, GithubLink
- **action**: CREATE, UPDATE, STATUS_CHANGE, DELETE
- **before/after**: JSON 형식 상태 비교
- **actor**: 작업 수행자 (선택적)
- **createdAt**: 타임스탐프

## 추후 확장 포인트

- **인증**: NextAuth.js로 OAuth (GitHub/Google) 로그인
- **실시간**: Server-Sent Events (SSE) 또는 WebSocket
- **GitHub 동기화**: GitHub REST API와 실시간 연동
- **알림**: 이메일/Slack 웹훅 알림
- **역할 관리**: RBAC (admin/reviewer/developer)
- **배포**: Vercel (Frontend) + Supabase (PostgreSQL)
- **DB 마이그레이션 (PostgreSQL)**: 프로덕션 시 SQLite → PostgreSQL로 전환
  ```bash
  # 1. schema.prisma의 datasource 변경
  # provider = "sqlite" → provider = "postgresql"
  # url = "file:..." → url = "postgresql://..."
  
  # 2. 마이그레이션 실행
  # npx prisma migrate deploy
  ```

## 컨벤션

- TypeScript strict mode 활성화
- API 응답은 `{ success: boolean, data?: T, error?: string }` 형식
- DB 모델명: 단수형 PascalCase (Task, Project, etc.)
- API route: resource 중심 설계
- 파일명: kebab-case (task-board.tsx)
- 감사 로그: 모든 UPDATE에서 `before/after` 기록

## 주의사항

- `.env.local` 파일은 git에 추가하지 마세요
- Prisma 스키마 변경 후 `prisma migrate dev` 실행
- API 응답 타입은 항상 명시적으로 선언
- 상태 enum은 직접 사용하지 말고 상수로 참조
- 감사 로그 누적 관리는 향후 아카이빙 전략 필요

---

**MVP 완성 일시**: 2026-04-21  
**업데이트**: SQLite 버전 (별도 설치 불필요)  
**기술 스택 버전**: Next.js 14.2, TypeScript 5.3, Prisma 5.20, SQLite 3
