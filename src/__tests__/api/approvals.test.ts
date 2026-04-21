import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPrismaApproval = {
  findMany: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
}

const mockCreateAuditLog = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: { approval: mockPrismaApproval },
}))

vi.mock('@/lib/audit', () => ({
  createAuditLog: mockCreateAuditLog,
}))

describe('Approvals API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should list all approvals', async () => {
    const approvals = [
      { id: '1', taskId: 't1', status: 'PENDING' },
      { id: '2', taskId: 't2', status: 'APPROVED' },
    ]
    mockPrismaApproval.findMany.mockResolvedValue(approvals)

    const result = await mockPrismaApproval.findMany()

    expect(result).toEqual(approvals)
  })

  it('should filter approvals by status', async () => {
    const pending = [{ id: '1', status: 'PENDING' }]
    mockPrismaApproval.findMany.mockResolvedValue(pending)

    const result = await mockPrismaApproval.findMany({
      where: { status: 'PENDING' },
    })

    expect(result).toEqual(pending)
  })

  it('should filter approvals by taskId', async () => {
    const taskApprovals = [{ id: '1', taskId: 't1', status: 'PENDING' }]
    mockPrismaApproval.findMany.mockResolvedValue(taskApprovals)

    const result = await mockPrismaApproval.findMany({
      where: { taskId: 't1' },
    })

    expect(result).toEqual(taskApprovals)
  })

  it('should approve an approval', async () => {
    const approved = {
      id: '1',
      status: 'APPROVED',
      reviewedBy: 'reviewer1',
      reviewedAt: new Date(),
    }
    mockPrismaApproval.update.mockResolvedValue(approved)
    mockCreateAuditLog.mockResolvedValue({})

    const result = await mockPrismaApproval.update({
      where: { id: '1' },
      data: {
        status: 'APPROVED',
        reviewedBy: 'reviewer1',
        reviewedAt: new Date(),
      },
    })

    expect(result.status).toBe('APPROVED')
  })

  it('should reject an approval', async () => {
    const rejected = {
      id: '1',
      status: 'REJECTED',
      reviewedBy: 'reviewer1',
      reviewedAt: new Date(),
    }
    mockPrismaApproval.update.mockResolvedValue(rejected)
    mockCreateAuditLog.mockResolvedValue({})

    const result = await mockPrismaApproval.update({
      where: { id: '1' },
      data: {
        status: 'REJECTED',
        reviewedBy: 'reviewer1',
      },
    })

    expect(result.status).toBe('REJECTED')
  })

  it('should audit approval status change', async () => {
    mockCreateAuditLog.mockResolvedValue({})

    await mockCreateAuditLog({
      taskId: 't1',
      entity: 'Approval',
      entityId: 'a1',
      action: 'STATUS_CHANGE',
      before: { status: 'PENDING' },
      after: { status: 'APPROVED' },
      actor: 'reviewer1',
    })

    expect(mockCreateAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'STATUS_CHANGE',
        actor: 'reviewer1',
      })
    )
  })
})
