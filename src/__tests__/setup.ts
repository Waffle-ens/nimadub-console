import { vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    approval: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    document: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    taskMessage: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    decision: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    githubLink: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    memorySnapshot: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  has: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => mockCookies),
}))
