import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockApproval, mockCreateAuditLog } = vi.hoisted(() => ({
  mockApproval: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  mockCreateAuditLog: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: { approval: mockApproval },
}))

vi.mock('@/lib/audit', () => ({
  createAuditLog: mockCreateAuditLog,
}))

import { GET, POST } from '@/app/api/tasks/[id]/approvals/route'

const params = { params: { id: 'task-1' } }

const makeRequest = (body?: object) =>
  new Request('http://localhost/api/tasks/task-1/approvals', {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

describe('GET /api/tasks/[id]/approvals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return approvals for a task ordered by createdAt desc', async () => {
    const approvals = [
      {
        id: 'a1',
        taskId: 'task-1',
        title: 'Deploy approval',
        description: 'Approve deployment to prod',
        status: 'PENDING',
        reviewedBy: null,
        reviewedAt: null,
        createdAt: '2025-04-21T00:00:00.000Z',
      },
    ]
    mockApproval.findMany.mockResolvedValue(approvals)

    const res = await GET(makeRequest() as any, params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual(approvals)
    expect(mockApproval.findMany).toHaveBeenCalledWith({
      where: { taskId: 'task-1' },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('should return empty array when task has no approvals', async () => {
    mockApproval.findMany.mockResolvedValue([])

    const res = await GET(makeRequest() as any, params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual([])
  })

  it('should return 500 on database error', async () => {
    mockApproval.findMany.mockRejectedValue(new Error('DB error'))

    const res = await GET(makeRequest() as any, params)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Failed to fetch approvals')
  })
})

describe('POST /api/tasks/[id]/approvals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create an approval with description and return 201', async () => {
    const newApproval = {
      id: 'a2',
      taskId: 'task-1',
      title: 'Code review',
      description: 'Review PR before merge',
      status: 'PENDING',
      reviewedBy: null,
      reviewedAt: null,
      createdAt: '2025-04-21T00:00:00.000Z',
    }
    mockApproval.create.mockResolvedValue(newApproval)
    mockCreateAuditLog.mockResolvedValue({})

    const res = await POST(
      makeRequest({ title: 'Code review', description: 'Review PR before merge' }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('a2')
    expect(body.data.status).toBe('PENDING')
    expect(mockApproval.create).toHaveBeenCalledWith({
      data: {
        taskId: 'task-1',
        title: 'Code review',
        description: 'Review PR before merge',
      },
    })
    expect(mockCreateAuditLog).toHaveBeenCalledWith({
      taskId: 'task-1',
      entity: 'Approval',
      entityId: 'a2',
      action: 'CREATE',
      after: newApproval,
    })
  })

  it('should create an approval without description (optional)', async () => {
    const newApproval = {
      id: 'a3',
      taskId: 'task-1',
      title: 'Quick check',
      description: null,
      status: 'PENDING',
      reviewedBy: null,
      reviewedAt: null,
      createdAt: '2025-04-21T00:00:00.000Z',
    }
    mockApproval.create.mockResolvedValue(newApproval)
    mockCreateAuditLog.mockResolvedValue({})

    const res = await POST(
      makeRequest({ title: 'Quick check' }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.description).toBeNull()
    expect(mockApproval.create).toHaveBeenCalledWith({
      data: {
        taskId: 'task-1',
        title: 'Quick check',
        description: undefined,
      },
    })
  })

  it('should return 400 when title is missing', async () => {
    const res = await POST(
      makeRequest({ description: 'No title' }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe('title is required')
    expect(mockApproval.create).not.toHaveBeenCalled()
  })

  it('should return 400 when body is empty', async () => {
    const res = await POST(makeRequest({}) as any, params)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe('title is required')
  })

  it('should return 500 on database error', async () => {
    mockApproval.create.mockRejectedValue(new Error('DB error'))

    const res = await POST(
      makeRequest({ title: 'Test approval' }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Failed to create approval')
  })
})
