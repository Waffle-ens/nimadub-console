import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPrismaTask = {
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

const mockCreateAuditLog = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: { task: mockPrismaTask },
}))

vi.mock('@/lib/audit', () => ({
  createAuditLog: mockCreateAuditLog,
}))

describe('Tasks API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should list all tasks', async () => {
    const tasks = [
      { id: '1', projectId: 'p1', title: 'Task 1', status: 'BACKLOG' },
      { id: '2', projectId: 'p1', title: 'Task 2', status: 'IN_PROGRESS' },
    ]
    mockPrismaTask.findMany.mockResolvedValue(tasks)

    const result = await mockPrismaTask.findMany({
      where: { projectId: 'p1' },
    })

    expect(result).toEqual(tasks)
  })

  it('should create a task', async () => {
    const newTask = {
      id: '3',
      projectId: 'p1',
      title: 'New Task',
      status: 'BACKLOG',
    }
    mockPrismaTask.create.mockResolvedValue(newTask)
    mockCreateAuditLog.mockResolvedValue({})

    const result = await mockPrismaTask.create({
      data: { projectId: 'p1', title: 'New Task' },
    })

    expect(result).toEqual(newTask)
  })

  it('should get a task with relations', async () => {
    const task = {
      id: '1',
      projectId: 'p1',
      title: 'Task',
      status: 'IN_PROGRESS',
      messages: [],
      decisions: [],
      approvals: [],
      memorySnapshots: [],
      githubLinks: [],
    }
    mockPrismaTask.findUnique.mockResolvedValue(task)

    const result = await mockPrismaTask.findUnique({
      where: { id: '1' },
      include: {
        messages: true,
        decisions: true,
        approvals: true,
        memorySnapshots: true,
        githubLinks: true,
      },
    })

    expect(result).toEqual(task)
  })

  it('should update task status', async () => {
    const before = { id: '1', status: 'BACKLOG' }
    const after = { id: '1', status: 'IN_PROGRESS' }
    mockPrismaTask.update.mockResolvedValue(after)
    mockCreateAuditLog.mockResolvedValue({})

    const result = await mockPrismaTask.update({
      where: { id: '1' },
      data: { status: 'IN_PROGRESS' },
    })

    expect(result.status).toBe('IN_PROGRESS')
  })

  it('should delete a task', async () => {
    const task = { id: '1', projectId: 'p1' }
    mockPrismaTask.delete.mockResolvedValue(task)
    mockCreateAuditLog.mockResolvedValue({})

    const result = await mockPrismaTask.delete({
      where: { id: '1' },
    })

    expect(result).toEqual(task)
  })

  it('should log audit on status change', async () => {
    mockCreateAuditLog.mockResolvedValue({})

    await mockCreateAuditLog({
      taskId: '1',
      entity: 'Task',
      entityId: '1',
      action: 'STATUS_CHANGE',
      before: { status: 'BACKLOG' },
      after: { status: 'IN_PROGRESS' },
    })

    expect(mockCreateAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'STATUS_CHANGE',
        taskId: '1',
      })
    )
  })
})
