import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockDecision, mockCreateAuditLog } = vi.hoisted(() => ({
  mockDecision: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  mockCreateAuditLog: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: { decision: mockDecision },
}))

vi.mock('@/lib/audit', () => ({
  createAuditLog: mockCreateAuditLog,
}))

import { GET, POST } from '@/app/api/tasks/[id]/decisions/route'

const params = { params: { id: 'task-1' } }

const makeRequest = (body?: object) =>
  new Request('http://localhost/api/tasks/task-1/decisions', {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

describe('GET /api/tasks/[id]/decisions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return decisions ordered by createdAt desc', async () => {
    const decisions = [
      {
        id: 'd1',
        taskId: 'task-1',
        title: 'Use PostgreSQL',
        context: 'Need a relational DB',
        decision: 'Go with PostgreSQL',
        rationale: 'Best fit for the schema',
        createdAt: '2025-04-20T00:00:00.000Z',
      },
    ]
    mockDecision.findMany.mockResolvedValue(decisions)

    const res = await GET(makeRequest() as any, params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual(decisions)
    expect(mockDecision.findMany).toHaveBeenCalledWith({
      where: { taskId: 'task-1' },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('should return empty array when no decisions', async () => {
    mockDecision.findMany.mockResolvedValue([])

    const res = await GET(makeRequest() as any, params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual([])
  })

  it('should return 500 on database error', async () => {
    mockDecision.findMany.mockRejectedValue(new Error('DB error'))

    const res = await GET(makeRequest() as any, params)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Failed to fetch decisions')
  })
})

describe('POST /api/tasks/[id]/decisions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a decision with rationale and return 201', async () => {
    const newDecision = {
      id: 'd2',
      taskId: 'task-1',
      title: 'Use Redis',
      context: 'Need caching layer',
      decision: 'Adopt Redis',
      rationale: 'Fast in-memory store',
      createdAt: '2025-04-21T00:00:00.000Z',
    }
    mockDecision.create.mockResolvedValue(newDecision)
    mockCreateAuditLog.mockResolvedValue({})

    const res = await POST(
      makeRequest({
        title: 'Use Redis',
        context: 'Need caching layer',
        decision: 'Adopt Redis',
        rationale: 'Fast in-memory store',
      }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('d2')
    expect(body.data.title).toBe('Use Redis')
    expect(mockDecision.create).toHaveBeenCalledWith({
      data: {
        taskId: 'task-1',
        title: 'Use Redis',
        context: 'Need caching layer',
        decision: 'Adopt Redis',
        rationale: 'Fast in-memory store',
      },
    })
    expect(mockCreateAuditLog).toHaveBeenCalledWith({
      taskId: 'task-1',
      entity: 'Decision',
      entityId: 'd2',
      action: 'CREATE',
      after: newDecision,
    })
  })

  it('should create a decision without rationale (optional)', async () => {
    const newDecision = {
      id: 'd3',
      taskId: 'task-1',
      title: 'Use TypeScript',
      context: 'Type safety needed',
      decision: 'Adopt TypeScript',
      rationale: null,
      createdAt: '2025-04-21T00:00:00.000Z',
    }
    mockDecision.create.mockResolvedValue(newDecision)
    mockCreateAuditLog.mockResolvedValue({})

    const res = await POST(
      makeRequest({
        title: 'Use TypeScript',
        context: 'Type safety needed',
        decision: 'Adopt TypeScript',
      }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.rationale).toBeNull()
    expect(mockDecision.create).toHaveBeenCalledWith({
      data: {
        taskId: 'task-1',
        title: 'Use TypeScript',
        context: 'Type safety needed',
        decision: 'Adopt TypeScript',
        rationale: undefined,
      },
    })
  })

  it('should return 400 when title is missing', async () => {
    const res = await POST(
      makeRequest({ context: 'some context', decision: 'some decision' }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe('title, context, decision are required')
    expect(mockDecision.create).not.toHaveBeenCalled()
  })

  it('should return 400 when context is missing', async () => {
    const res = await POST(
      makeRequest({ title: 'Title', decision: 'decision' }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe('title, context, decision are required')
    expect(mockDecision.create).not.toHaveBeenCalled()
  })

  it('should return 400 when decision is missing', async () => {
    const res = await POST(
      makeRequest({ title: 'Title', context: 'Context' }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe('title, context, decision are required')
    expect(mockDecision.create).not.toHaveBeenCalled()
  })

  it('should return 400 when all required fields are missing', async () => {
    const res = await POST(makeRequest({}) as any, params)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('should return 500 on database error', async () => {
    mockDecision.create.mockRejectedValue(new Error('DB error'))

    const res = await POST(
      makeRequest({ title: 'T', context: 'C', decision: 'D' }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Failed to create decision')
  })
})
