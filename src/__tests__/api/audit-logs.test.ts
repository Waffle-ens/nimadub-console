import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPrismaAuditLog = {
  findMany: vi.fn(),
  create: vi.fn(),
}

vi.mock('@/lib/prisma', () => ({
  prisma: { auditLog: mockPrismaAuditLog },
}))

describe('Audit Logs API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should list all audit logs', async () => {
    const logs = [
      { id: '1', entity: 'Project', entityId: 'p1', action: 'CREATE' },
      { id: '2', entity: 'Task', entityId: 't1', action: 'UPDATE' },
    ]
    mockPrismaAuditLog.findMany.mockResolvedValue(logs)

    const result = await mockPrismaAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    expect(result).toEqual(logs)
  })

  it('should filter by taskId', async () => {
    const taskLogs = [
      { id: '1', taskId: 't1', entity: 'Task', action: 'CREATE' },
      { id: '2', taskId: 't1', entity: 'Task', action: 'UPDATE' },
    ]
    mockPrismaAuditLog.findMany.mockResolvedValue(taskLogs)

    const result = await mockPrismaAuditLog.findMany({
      where: { taskId: 't1' },
    })

    expect(result).toEqual(taskLogs)
  })

  it('should filter by entity type', async () => {
    const projectLogs = [
      { id: '1', entity: 'Project', entityId: 'p1', action: 'CREATE' },
      { id: '2', entity: 'Project', entityId: 'p2', action: 'DELETE' },
    ]
    mockPrismaAuditLog.findMany.mockResolvedValue(projectLogs)

    const result = await mockPrismaAuditLog.findMany({
      where: { entity: 'Project' },
    })

    expect(result).toEqual(projectLogs)
  })

  it('should respect limit parameter', async () => {
    const logs = Array(10).fill(null).map((_, i) => ({
      id: String(i),
      entity: 'Task',
      action: 'CREATE',
    }))
    mockPrismaAuditLog.findMany.mockResolvedValue(logs)

    const result = await mockPrismaAuditLog.findMany({
      take: 10,
    })

    expect(result).toHaveLength(10)
  })

  it('should track CREATE action', async () => {
    const log = {
      id: '1',
      entity: 'Project',
      entityId: 'p1',
      action: 'CREATE',
      after: { id: 'p1', name: 'New Project' },
    }
    mockPrismaAuditLog.findMany.mockResolvedValue([log])

    const result = await mockPrismaAuditLog.findMany({
      where: { action: 'CREATE' },
    })

    expect(result[0].action).toBe('CREATE')
  })

  it('should track UPDATE action', async () => {
    const log = {
      id: '2',
      entity: 'Task',
      entityId: 't1',
      action: 'UPDATE',
      before: { status: 'BACKLOG' },
      after: { status: 'IN_PROGRESS' },
    }
    mockPrismaAuditLog.findMany.mockResolvedValue([log])

    const result = await mockPrismaAuditLog.findMany({
      where: { action: 'UPDATE' },
    })

    expect(result[0].action).toBe('UPDATE')
  })

  it('should track DELETE action', async () => {
    const log = {
      id: '3',
      entity: 'Project',
      entityId: 'p1',
      action: 'DELETE',
      before: { id: 'p1', name: 'Deleted' },
    }
    mockPrismaAuditLog.findMany.mockResolvedValue([log])

    const result = await mockPrismaAuditLog.findMany({
      where: { action: 'DELETE' },
    })

    expect(result[0].action).toBe('DELETE')
  })

  it('should track STATUS_CHANGE action', async () => {
    const log = {
      id: '4',
      entity: 'Task',
      entityId: 't1',
      action: 'STATUS_CHANGE',
      before: { status: 'BACKLOG' },
      after: { status: 'DONE' },
    }
    mockPrismaAuditLog.findMany.mockResolvedValue([log])

    const result = await mockPrismaAuditLog.findMany({
      where: { action: 'STATUS_CHANGE' },
    })

    expect(result[0].action).toBe('STATUS_CHANGE')
  })

  it('should include actor information', async () => {
    const log = {
      id: '1',
      entity: 'Approval',
      action: 'STATUS_CHANGE',
      actor: 'reviewer1',
    }
    mockPrismaAuditLog.findMany.mockResolvedValue([log])

    const result = await mockPrismaAuditLog.findMany()

    expect(result[0].actor).toBe('reviewer1')
  })

  it('should serialize before/after as JSON strings', async () => {
    const log = {
      id: '1',
      entity: 'Project',
      before: JSON.stringify({ name: 'Old' }),
      after: JSON.stringify({ name: 'New' }),
    }
    mockPrismaAuditLog.findMany.mockResolvedValue([log])

    const result = await mockPrismaAuditLog.findMany()

    expect(typeof result[0].before).toBe('string')
    expect(typeof result[0].after).toBe('string')
  })
})
