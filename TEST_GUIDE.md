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
    └── audit-logs.test.ts    # Audit Logs API 테스트
```

## 테스트 커버리지

| 모듈 | 커버리지 | 상태 |
|------|---------|------|
| `src/lib/auth.ts` | 100% | ✅ |
| `src/lib/audit.ts` | 100% | ✅ |
| `src/types/index.ts` | 100% | ✅ |
| `src/app/api/*` | 테스트 중 | 🔄 |

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

## 문제 해결

### Mock이 작동하지 않는 경우
- setup.ts의 모킹이 제대로 로드되었는지 확인
- 테스트 파일에서 import 순서 확인 (mock 정의가 먼저)

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
- API 라우트는 통합 테스트로 주요 케이스 커버
- 모킹을 통해 데이터베이스 접근 없이 테스트 실행
