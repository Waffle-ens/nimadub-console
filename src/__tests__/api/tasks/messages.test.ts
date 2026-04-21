import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockTaskMessage, mockCreateAuditLog } = vi.hoisted(() => ({
  mockTaskMessage: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  mockCreateAuditLog: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: { taskMessage: mockTaskMessage },
}))

vi.mock('@/lib/audit', () => ({
  createAuditLog: mockCreateAuditLog,
}))

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
      { id: 'm2', taskId: 'task-1', role: 'assistant', content: 'Hi', createdAt: '2025-01-02T00:00:00.000Z' },
    ]
    mockTaskMessage.findMany.mockResolvedValue(messages)

    const res = await GET(makeRequest() as any, params)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual(messages)
    expect(mockTaskMessage.findMany).toHaveBeenCalledWith({
      where: { taskId: 'task-1' },
      orderBy: { createdAt: 'asc' },
    })
  })

  it('should return 500 on database error', async () => {
    mockTaskMessage.findMany.mockRejectedValue(new Error('DB error'))

    const res = await GET(makeRequest() as any, params)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Failed to fetch messages')
  })
})

describe('POST /api/tasks/[id]/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a user message and return 201', async () => {
    const createdAt = '2025-04-21T00:00:00.000Z'
    const newMessage = {
      id: 'm3',
      taskId: 'task-1',
      role: 'user',
      content: 'New message',
      createdAt,
    }
    mockTaskMessage.create.mockResolvedValue(newMessage)
    mockCreateAuditLog.mockResolvedValue({})

    const res = await POST(
      makeRequest({ role: 'user', content: 'New message' }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('m3')
    expect(body.data.role).toBe('user')
    expect(body.data.content).toBe('New message')
    expect(mockTaskMessage.create).toHaveBeenCalledWith({
      data: { taskId: 'task-1', role: 'user', content: 'New message' },
    })
    expect(mockCreateAuditLog).toHaveBeenCalledWith({
      taskId: 'task-1',
      entity: 'TaskMessage',
      entityId: 'm3',
      action: 'CREATE',
      after: newMessage,
    })
  })

  it('should create an assistant message', async () => {
    const assistantMsg = {
      id: 'm4',
      taskId: 'task-1',
      role: 'assistant',
      content: 'AI response',
      createdAt: new Date(),
    }
    mockTaskMessage.create.mockResolvedValue(assistantMsg)
    mockCreateAuditLog.mockResolvedValue({})

    const res = await POST(
      makeRequest({ role: 'assistant', content: 'AI response' }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.role).toBe('assistant')
  })

  it('should create a system message', async () => {
    const systemMsg = {
      id: 'm5',
      taskId: 'task-1',
      role: 'system',
      content: 'System prompt',
      createdAt: new Date(),
    }
    mockTaskMessage.create.mockResolvedValue(systemMsg)
    mockCreateAuditLog.mockResolvedValue({})

    const res = await POST(
      makeRequest({ role: 'system', content: 'System prompt' }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.role).toBe('system')
  })

  it('should return 400 when role is missing', async () => {
    const res = await POST(
      makeRequest({ content: 'No role' }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe('role and content are required')
    expect(mockTaskMessage.create).not.toHaveBeenCalled()
  })

  it('should return 400 when content is missing', async () => {
    const res = await POST(
      makeRequest({ role: 'user' }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe('role and content are required')
    expect(mockTaskMessage.create).not.toHaveBeenCalled()
  })

  it('should return 400 when both role and content are missing', async () => {
    const res = await POST(makeRequest({}) as any, params)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('should return 500 on database error', async () => {
    mockTaskMessage.create.mockRejectedValue(new Error('DB error'))

    const res = await POST(
      makeRequest({ role: 'user', content: 'Hello' }) as any,
      params
    )
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Failed to create message')
  })
})
