# Nimadub 테스트 가이드

## 테스트 실행

### 기본 테스트 실행
```bash
npm test
```

### Watch 모드 (파일 변경 감지)
```bash
npm run test:watch
```

### 커버리지 리포트
```bash
npm run test:coverage
```

## 테스트 구조

```
src/__tests__/
├── __mocks__/
│   ├── next-headers.ts       # next/headers 모킹
│   └── prisma.ts             # Prisma 클라이언트 모킹
├── setup.ts                  # 글로벌 테스트 설정
├── lib/
│   ├── auth.test.ts          # 인증 유틸리티 테스트 (100%)
│   └── audit.test.ts         # 감사 로그 유틸리티 테스트 (100%)
├── types/
│   └── index.test.ts         # 타입 상수 테스트 (100%)
└── api/
    ├── projects.test.ts      # Projects API 테스트
    ├── tasks.test.ts         # Tasks API 테스트
    ├── approvals.test.ts     # Approvals API 테스트
    ├── documents.test.ts     # Documents API 테스트
    ├── audit-logs.test.ts    # Audit Logs API 테스트
    └── tasks/
        ├── messages.test.ts           # Task Messages 서브리소스 (100%)
        ├── decisions.test.ts          # Task Decisions 서브리소스 (100%)
        ├── task-approvals.test.ts     # Task Approvals 서브리소스 (100%)
        ├── github-links.test.ts       # Task GitHub Links 서브리소스 (100%)
        └── memory-snapshots.test.ts   # Task Memory Snapshots 서브리소스 (100%)
```

## 테스트 커버리지

| 모듈 | 파일 수 | 테스트 수 | 커버리지 | 상태 |
|------|--------|---------|---------|------|
| `src/lib/auth.ts` | 1 | 10 | 100% | ✅ |
| `src/lib/audit.ts` | 1 | 4 | 100% | ✅ |
| `src/types/index.ts` | 1 | 14 | 100% | ✅ |
| `src/app/api/projects/**` | 2 | 9 | 모킹 기반 | ✅ |
| `src/app/api/tasks/**` | 2 | 6 | 모킹 기반 | ✅ |
| `src/app/api/approvals/**` | 2 | 6 | 모킹 기반 | ✅ |
| `src/app/api/documents/**` | 2 | 8 | 모킹 기반 | ✅ |
| `src/app/api/audit-logs/**` | 1 | 10 | 모킹 기반 | ✅ |
| `src/app/api/tasks/[id]/messages/route.ts` | 1 | 9 | 100% | ✅ |
| `src/app/api/tasks/[id]/decisions/route.ts` | 1 | 10 | 100% | ✅ |
| `src/app/api/tasks/[id]/approvals/route.ts` | 1 | 8 | 100% | ✅ |
| `src/app/api/tasks/[id]/github-links/route.ts` | 1 | 10 | 100% | ✅ |
| `src/app/api/tasks/[id]/memory-snapshots/route.ts` | 1 | 12 | 100% | ✅ |
| **합계** | **13** | **116** | — | **✅** |

## 테스트 프레임워크

- **Vitest**: Unit 테스트 프레임워크
- **@vitest/coverage-v8**: 커버리지 분석
- **vi.mock()**: Prisma, next/headers 모킹

## 테스트 작성 패턴

### 기본 테스트 구조
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// 모킹 정의
const mockFunction = vi.fn()

vi.mock('@/lib/module', () => ({
  module: { function: mockFunction },
}))

describe('기능명', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should do something', () => {
    mockFunction.mockResolvedValue({ success: true })
    expect(mockFunction).toHaveBeenCalled()
  })
})
```

### 서브리소스 API 테스트 패턴 (vi.hoisted)

라우트 핸들러를 직접 import하고 호출하여 100% 커버리지를 달성하려면 `vi.hoisted()`를 사용해야 합니다:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted()로 모킹 함수를 먼저 정의 (vi.mock() hoisting을 피함)
const { mockTaskMessage, mockCreateAuditLog } = vi.hoisted(() => ({
  mockTaskMessage: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  mockCreateAuditLog: vi.fn(),
}))

// 이제 vi.mock()이 hoisted 변수를 참조 가능
vi.mock('@/lib/prisma', () => ({
  prisma: { taskMessage: mockTaskMessage },
}))

vi.mock('@/lib/audit', () => ({
  createAuditLog: mockCreateAuditLog,
}))

// 모킹 후 실제 라우트 핸들러 import
import { GET, POST } from '@/app/api/tasks/[id]/messages/route'

const params = { params: { id: 'task-1' } }

const makeRequest = (body?: object) =>
  new Request('http://localhost/api/tasks/task-1/messages', {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

describe('GET /api/tasks/[id]/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return messages ordered by createdAt asc', async () => {
    const messages = [
      { id: 'm1', taskId: 'task-1', role: 'user', content: 'Hello', createdAt: '2025-01-01T00:00:00.000Z' },
    ]
    mockTaskMessage.findMany.mockResolvedValue(messages)

    const res = await GET(makeRequest() as any, params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual(messages)
  })
})
```

**핵심 포인트:**
- `vi.hoisted(() => ({ ... }))` 사용으로 mock 함수를 `vi.mock()` 호이스팅 이전에 선언
- 실제 라우트 핸들러(`GET`, `POST`)를 import한 후 호출
- `new Request()` 객체로 HTTP 요청 시뮬레이션
- 모든 분기(성공, 유효성 검증 실패, DB 오류) 테스트로 100% 커버리지 달성

## CI/CD 통합

모든 커밋 전에 테스트가 실행되며, 실패 시 커밋이 차단됩니다.

```bash
git commit -m "feat: 새로운 기능"
# npm test가 자동으로 실행됨
```

## 주요 테스트 케이스

### auth.test.ts
- ✅ checkAuth - 쿠키 검증
- ✅ verifyPassword - 비밀번호 확인
- ✅ setAuthCookie - 쿠키 설정
- ✅ clearAuthCookie - 쿠키 삭제

### audit.test.ts
- ✅ createAuditLog - 감사 로그 생성
- ✅ JSON 직렬화 처리
- ✅ Optional 필드 처리

### types/index.test.ts
- ✅ 모든 상수 정의 확인 (TASK_STATUS, APPROVAL_STATUS 등)
- ✅ 타입 무결성 검증

### API 테스트
- ✅ CRUD 작업 (Create, Read, Update, Delete)
- ✅ 필터링 및 검색
- ✅ 감사 로그 추적
- ✅ 에러 처리

### 서브리소스 API 테스트 (AI 에이전트 핵심 기능)
- ✅ **messages** — user/assistant/system 메시지 생성/조회, 필수 필드 검증
- ✅ **decisions** — 아키텍처 결정사항 기록, context/decision/rationale 필드
- ✅ **approvals** — 태스크 승인 관리, 상태(PENDING/APPROVED/REJECTED) 전환
- ✅ **github-links** — PR/Issue 링크 추적, url/number/title 필드
- ✅ **memory-snapshots** — 컨텍스트 스냅샷 (TASK/SPRINT/CONSTITUTION/RESET_SUMMARY)

각 서브리소스는 GET(목록), POST(생성), 필수 필드 검증, DB 오류 처리를 포함하며 모두 100% 커버리지를 달성합니다.

## 문제 해결

### Mock이 작동하지 않는 경우
- setup.ts의 모킹이 제대로 로드되었는지 확인
- 테스트 파일에서 import 순서 확인 (mock 정의가 먼저)
- 서브리소스 라우트 테스트는 `vi.hoisted()` 패턴 필수

### 테스트 타임아웃
```bash
npm test -- --testTimeout=10000
```

### 특정 테스트만 실행
```bash
npm test -- --grep "should do something"
```

## 참고

- 모든 유틸리티와 타입은 100% 커버리지 달성
- 서브리소스 API 라우트(messages, decisions 등)는 직접 호출로 100% 실제 커버리지 달성
- 메인 API 라우트는 모킹 기반으로 주요 경로만 커버
- 모킹을 통해 데이터베이스 접근 없이 테스트 실행
