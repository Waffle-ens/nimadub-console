import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAuditLog } from '@/lib/audit'
import { prisma } from '@/lib/prisma'

describe('audit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createAuditLog', () => {
    it('should call prisma.auditLog.create with all fields', async () => {
      const before = { id: '1', name: 'old' }
      const after = { id: '1', name: 'new' }
      const mockLog = {
        id: 'log-1',
        entity: 'Project',
        entityId: '1',
        action: 'UPDATE',
        before: JSON.stringify(before),
        after: JSON.stringify(after),
      }
      vi.mocked(prisma.auditLog.create).mockResolvedValue(mockLog as any)

      const result = await createAuditLog({
        entity: 'Project',
        entityId: '1',
        action: 'UPDATE',
        before,
        after,
        actor: 'user123',
      })

      expect(vi.mocked(prisma.auditLog.create)).toHaveBeenCalledWith({
        data: {
          taskId: undefined,
          entity: 'Project',
          entityId: '1',
          action: 'UPDATE',
          before: JSON.stringify(before),
          after: JSON.stringify(after),
          actor: 'user123',
        },
      })
      expect(result).toEqual(mockLog)
    })

    it('should handle before/after JSON serialization', async () => {
      const before = { field: 'value', nested: { prop: 123 } }
      const after = { field: 'value', nested: { prop: 456 } }

      vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as any)

      await createAuditLog({
        entity: 'Task',
        entityId: 'task-1',
        action: 'STATUS_CHANGE',
        before,
        after,
      })

      expect(vi.mocked(prisma.auditLog.create)).toHaveBeenCalledWith({
        data: expect.objectContaining({
          before: JSON.stringify(before),
          after: JSON.stringify(after),
        }),
      })
    })

    it('should set undefined for missing optional fields', async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as any)

      await createAuditLog({
        entity: 'Document',
        entityId: 'doc-1',
        action: 'CREATE',
      })

      expect(vi.mocked(prisma.auditLog.create)).toHaveBeenCalledWith({
        data: {
          taskId: undefined,
          entity: 'Document',
          entityId: 'doc-1',
          action: 'CREATE',
          before: undefined,
          after: undefined,
          actor: undefined,
        },
      })
    })

    it('should include taskId when provided', async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'log-1' } as any)

      await createAuditLog({
        taskId: 'task-123',
        entity: 'Approval',
        entityId: 'approval-1',
        action: 'CREATE',
      })

      expect(vi.mocked(prisma.auditLog.create)).toHaveBeenCalledWith({
        data: expect.objectContaining({
          taskId: 'task-123',
        }),
      })
    })
  })
})
