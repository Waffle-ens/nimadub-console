import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockMemorySnapshot, mockCreateAuditLog } = vi.hoisted(() => ({
  mockMemorySnapshot: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  mockCreateAuditLog: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: { memorySnapshot: mockMemorySnapshot },
}))

vi.mock('@/lib/audit', () => ({
  createAuditLog: mockCreateAuditLog,
}))

import { GET, POST } from '@/app/api/tasks/[id]/memory-snapshots/route'

const params = { params: { id: 'task-1' } }

const makeRequest = (body?: object) =>
  new Request('http://localhost/api/tasks/task-1/memory-snapshots', {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

describe('GET /api/tasks/[id]/memory-snapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return memory snapshots for a task ordered by createdAt desc', async () => {
    const snapshots = [
      {
        id: 's1',
        taskId: 'task-1',
        type: 'TASK',
        title: 'Task context snapshot',
        content: 'Current task context...',
        createdAt: '2025-04-21T00:00:00.000Z',
      },
      {
        id: 's2',
        taskId: 'task-1',
        type: 'SPRINT',
        title: 'Sprint summary',
        content: 'Sprint 3 progress...',
        createdAt: '2025-04-20T00:00:00.000Z',
      },
    ]
    mockMemorySnapshot.findMany.mockResolvedValue(snapshots)

    const res = await GET(makeRequest() as any, params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual(snapshots)
    expect(mockMemorySnapshot.findMany).toHaveBeenCalledWith({
      where: { taskId: 'task-1' },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('should return empty array when no snapshots', async () => {
    mockMemorySnapshot.findMany.mockResolvedValue([])

    const res = await GET(makeRequest() as any, params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual([])
  })

  it('should return 500 on database error', async () => {
    mockMemorySnapshot.findMany.mockRejectedValue(new Error('DB error'))

    const res = await GET(makeRequest() as any, params)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Failed to fetch memory snapshots')
  })
})

describe('POST /api/tasks/[id]/memory-snapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a TASK type snapshot and return 201', async () => {
    const newSnapshot = {
      id: 's3',
      taskId: 'task-1',
      type: 'TASK',
      title: 'Task snapshot',
      content: 'Current working state of the task',
      createdAt: '2025-04-21T00:00:00.000Z',
    }
    mockMemorySnapshot.create.mockResolvedValue(newSnapshot)
    mockCreateAuditLog.mockResolvedValue({})

    const res = await POST(
      makeRequest({
        type: 'TASK',
        title: 'Task snapshot',
        content: 'Current working state of the task',
      }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('s3')
    expect(body.data.type).toBe('TASK')
    expect(mockMemorySnapshot.create).toHaveBeenCalledWith({
      data: {
        taskId: 'task-1',
        type: 'TASK',
        title: 'Task snapshot',
        content: 'Current working state of the task',
      },
    })
    expect(mockCreateAuditLog).toHaveBeenCalledWith({
      taskId: 'task-1',
      entity: 'MemorySnapshot',
      entityId: 's3',
      action: 'CREATE',
      after: newSnapshot,
    })
  })

  it('should create a CONSTITUTION type snapshot', async () => {
    const snapshot = {
      id: 's4',
      taskId: 'task-1',
      type: 'CONSTITUTION',
      title: 'Agent constitution',
      content: 'Rules for the AI agent...',
      createdAt: '2025-04-21T00:00:00.000Z',
    }
    mockMemorySnapshot.create.mockResolvedValue(snapshot)
    mockCreateAuditLog.mockResolvedValue({})

    const res = await POST(
      makeRequest({
        type: 'CONSTITUTION',
        title: 'Agent constitution',
        content: 'Rules for the AI agent...',
      }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.type).toBe('CONSTITUTION')
  })

  it('should create a SPRINT type snapshot', async () => {
    const snapshot = {
      id: 's5',
      taskId: 'task-1',
      type: 'SPRINT',
      title: 'Sprint 4 start',
      content: 'Sprint goals and context',
      createdAt: '2025-04-21T00:00:00.000Z',
    }
    mockMemorySnapshot.create.mockResolvedValue(snapshot)
    mockCreateAuditLog.mockResolvedValue({})

    const res = await POST(
      makeRequest({
        type: 'SPRINT',
        title: 'Sprint 4 start',
        content: 'Sprint goals and context',
      }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.type).toBe('SPRINT')
  })

  it('should create a RESET_SUMMARY type snapshot', async () => {
    const snapshot = {
      id: 's6',
      taskId: 'task-1',
      type: 'RESET_SUMMARY',
      title: 'Context reset',
      content: 'Summary before context window reset',
      createdAt: '2025-04-21T00:00:00.000Z',
    }
    mockMemorySnapshot.create.mockResolvedValue(snapshot)
    mockCreateAuditLog.mockResolvedValue({})

    const res = await POST(
      makeRequest({
        type: 'RESET_SUMMARY',
        title: 'Context reset',
        content: 'Summary before context window reset',
      }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.type).toBe('RESET_SUMMARY')
  })

  it('should return 400 when type is missing', async () => {
    const res = await POST(
      makeRequest({ title: 'Snapshot', content: 'Content' }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe('type, title, content are required')
    expect(mockMemorySnapshot.create).not.toHaveBeenCalled()
  })

  it('should return 400 when title is missing', async () => {
    const res = await POST(
      makeRequest({ type: 'TASK', content: 'Content' }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe('type, title, content are required')
    expect(mockMemorySnapshot.create).not.toHaveBeenCalled()
  })

  it('should return 400 when content is missing', async () => {
    const res = await POST(
      makeRequest({ type: 'TASK', title: 'Snapshot' }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe('type, title, content are required')
    expect(mockMemorySnapshot.create).not.toHaveBeenCalled()
  })

  it('should return 400 when all required fields are missing', async () => {
    const res = await POST(makeRequest({}) as any, params)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('should return 500 on database error', async () => {
    mockMemorySnapshot.create.mockRejectedValue(new Error('DB error'))

    const res = await POST(
      makeRequest({ type: 'TASK', title: 'T', content: 'C' }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Failed to create memory snapshot')
  })
})
