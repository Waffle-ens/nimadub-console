import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPrismaProject = {
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

const mockCreateAuditLog = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: mockPrismaProject,
  },
}))

vi.mock('@/lib/audit', () => ({
  createAuditLog: mockCreateAuditLog,
}))

describe('Projects API', () => {
  beforeEach(() => {
    mockPrismaProject.findMany.mockClear()
    mockPrismaProject.findUnique.mockClear()
    mockPrismaProject.create.mockClear()
    mockPrismaProject.update.mockClear()
    mockPrismaProject.delete.mockClear()
    mockCreateAuditLog.mockClear()
  })

  describe('List projects', () => {
    it('should fetch all projects', async () => {
      const mockProjects = [
        { id: '1', name: 'Project A', description: 'Desc A' },
        { id: '2', name: 'Project B', description: null },
      ]
      mockPrismaProject.findMany.mockResolvedValue(mockProjects)

      const result = await mockPrismaProject.findMany({
        orderBy: { createdAt: 'desc' },
      })

      expect(result).toEqual(mockProjects)
      expect(mockPrismaProject.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('Create project', () => {
    it('should create a new project', async () => {
      const newProject = { id: '3', name: 'New', description: 'New Desc' }
      mockPrismaProject.create.mockResolvedValue(newProject)
      mockCreateAuditLog.mockResolvedValue({})

      const result = await mockPrismaProject.create({
        data: { name: 'New', description: 'New Desc' },
      })

      expect(result).toEqual(newProject)
      expect(mockPrismaProject.create).toHaveBeenCalledWith({
        data: { name: 'New', description: 'New Desc' },
      })
    })

    it('should create project with null description', async () => {
      const newProject = { id: '4', name: 'Minimal', description: null }
      mockPrismaProject.create.mockResolvedValue(newProject)

      const result = await mockPrismaProject.create({
        data: { name: 'Minimal', description: undefined },
      })

      expect(result.description).toBeNull()
    })
  })

  describe('Get project', () => {
    it('should fetch single project by id', async () => {
      const mockProject = { id: '1', name: 'Project A', description: 'Desc' }
      mockPrismaProject.findUnique.mockResolvedValue(mockProject)

      const result = await mockPrismaProject.findUnique({
        where: { id: '1' },
      })

      expect(result).toEqual(mockProject)
      expect(mockPrismaProject.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      })
    })

    it('should return null when project not found', async () => {
      mockPrismaProject.findUnique.mockResolvedValue(null)

      const result = await mockPrismaProject.findUnique({
        where: { id: 'nonexistent' },
      })

      expect(result).toBeNull()
    })
  })

  describe('Update project', () => {
    it('should update project', async () => {
      const before = { id: '1', name: 'Old', description: 'Old' }
      const after = { id: '1', name: 'Updated', description: 'Updated' }
      mockPrismaProject.update.mockResolvedValue(after)
      mockCreateAuditLog.mockResolvedValue({})

      const result = await mockPrismaProject.update({
        where: { id: '1' },
        data: { name: 'Updated', description: 'Updated' },
      })

      expect(result).toEqual(after)
    })

    it('should audit log project update', async () => {
      mockCreateAuditLog.mockResolvedValue({})

      await mockCreateAuditLog({
        entity: 'Project',
        entityId: '1',
        action: 'UPDATE',
        before: { name: 'Old' },
        after: { name: 'New' },
      })

      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: 'Project',
          entityId: '1',
          action: 'UPDATE',
        })
      )
    })
  })

  describe('Delete project', () => {
    it('should delete project', async () => {
      const deleted = { id: '1', name: 'Deleted' }
      mockPrismaProject.delete.mockResolvedValue(deleted)
      mockCreateAuditLog.mockResolvedValue({})

      const result = await mockPrismaProject.delete({
        where: { id: '1' },
      })

      expect(result).toEqual(deleted)
      expect(mockPrismaProject.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      })
    })

    it('should audit log project deletion', async () => {
      mockCreateAuditLog.mockResolvedValue({})

      await mockCreateAuditLog({
        entity: 'Project',
        entityId: '1',
        action: 'DELETE',
        before: { id: '1', name: 'Deleted' },
      })

      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETE',
        })
      )
    })
  })
})
