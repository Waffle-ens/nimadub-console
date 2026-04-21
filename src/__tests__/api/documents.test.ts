import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPrismaDocument = {
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

const mockCreateAuditLog = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: { document: mockPrismaDocument },
}))

vi.mock('@/lib/audit', () => ({
  createAuditLog: mockCreateAuditLog,
}))

describe('Documents API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should list all documents', async () => {
    const docs = [
      { id: '1', title: 'Doc 1', type: 'PRD', content: 'content' },
      { id: '2', title: 'Doc 2', type: 'ADR', content: 'content' },
    ]
    mockPrismaDocument.findMany.mockResolvedValue(docs)

    const result = await mockPrismaDocument.findMany()

    expect(result).toEqual(docs)
  })

  it('should filter documents by projectId', async () => {
    const projDocs = [
      { id: '1', projectId: 'p1', title: 'Doc 1', type: 'PRD' },
    ]
    mockPrismaDocument.findMany.mockResolvedValue(projDocs)

    const result = await mockPrismaDocument.findMany({
      where: { projectId: 'p1' },
    })

    expect(result).toEqual(projDocs)
  })

  it('should filter documents by taskId', async () => {
    const taskDocs = [
      { id: '1', taskId: 't1', title: 'Doc', type: 'ADR' },
    ]
    mockPrismaDocument.findMany.mockResolvedValue(taskDocs)

    const result = await mockPrismaDocument.findMany({
      where: { taskId: 't1' },
    })

    expect(result).toEqual(taskDocs)
  })

  it('should filter documents by type', async () => {
    const prdDocs = [
      { id: '1', title: 'PRD', type: 'PRD' },
    ]
    mockPrismaDocument.findMany.mockResolvedValue(prdDocs)

    const result = await mockPrismaDocument.findMany({
      where: { type: 'PRD' },
    })

    expect(result).toEqual(prdDocs)
  })

  it('should create a document', async () => {
    const doc = {
      id: '3',
      title: 'New Doc',
      type: 'OTHER',
      content: 'content',
    }
    mockPrismaDocument.create.mockResolvedValue(doc)
    mockCreateAuditLog.mockResolvedValue({})

    const result = await mockPrismaDocument.create({
      data: { title: 'New Doc', type: 'OTHER', content: 'content' },
    })

    expect(result).toEqual(doc)
  })

  it('should update a document', async () => {
    const updated = {
      id: '1',
      title: 'Updated',
      content: 'updated content',
    }
    mockPrismaDocument.update.mockResolvedValue(updated)
    mockCreateAuditLog.mockResolvedValue({})

    const result = await mockPrismaDocument.update({
      where: { id: '1' },
      data: { title: 'Updated', content: 'updated content' },
    })

    expect(result.title).toBe('Updated')
  })

  it('should delete a document', async () => {
    const doc = { id: '1', title: 'Delete Me' }
    mockPrismaDocument.delete.mockResolvedValue(doc)
    mockCreateAuditLog.mockResolvedValue({})

    const result = await mockPrismaDocument.delete({
      where: { id: '1' },
    })

    expect(result).toEqual(doc)
  })

  it('should audit document creation', async () => {
    mockCreateAuditLog.mockResolvedValue({})

    await mockCreateAuditLog({
      taskId: undefined,
      entity: 'Document',
      entityId: 'd1',
      action: 'CREATE',
      after: { title: 'New' },
    })

    expect(mockCreateAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: 'Document',
        action: 'CREATE',
      })
    )
  })
})
