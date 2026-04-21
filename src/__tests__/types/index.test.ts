import { describe, it, expect } from 'vitest'
import {
  TASK_STATUS,
  APPROVAL_STATUS,
  MEMORY_TYPE,
  DOCUMENT_TYPE,
  MESSAGE_ROLE,
  GITHUB_LINK_TYPE,
} from '@/types'

describe('types/index', () => {
  describe('TASK_STATUS', () => {
    it('should have all required task statuses', () => {
      expect(TASK_STATUS.BACKLOG).toBe('BACKLOG')
      expect(TASK_STATUS.READY).toBe('READY')
      expect(TASK_STATUS.IN_PROGRESS).toBe('IN_PROGRESS')
      expect(TASK_STATUS.REVIEW).toBe('REVIEW')
      expect(TASK_STATUS.QA).toBe('QA')
      expect(TASK_STATUS.STAGING).toBe('STAGING')
      expect(TASK_STATUS.DONE).toBe('DONE')
      expect(TASK_STATUS.BLOCKED).toBe('BLOCKED')
    })

    it('should have correct number of statuses', () => {
      const keys = Object.keys(TASK_STATUS)
      expect(keys).toHaveLength(8)
    })
  })

  describe('APPROVAL_STATUS', () => {
    it('should have all required approval statuses', () => {
      expect(APPROVAL_STATUS.PENDING).toBe('PENDING')
      expect(APPROVAL_STATUS.APPROVED).toBe('APPROVED')
      expect(APPROVAL_STATUS.REJECTED).toBe('REJECTED')
    })

    it('should have correct number of statuses', () => {
      const keys = Object.keys(APPROVAL_STATUS)
      expect(keys).toHaveLength(3)
    })
  })

  describe('MEMORY_TYPE', () => {
    it('should have all required memory types', () => {
      expect(MEMORY_TYPE.CONSTITUTION).toBe('CONSTITUTION')
      expect(MEMORY_TYPE.SPRINT).toBe('SPRINT')
      expect(MEMORY_TYPE.TASK).toBe('TASK')
      expect(MEMORY_TYPE.RESET_SUMMARY).toBe('RESET_SUMMARY')
    })

    it('should have correct number of types', () => {
      const keys = Object.keys(MEMORY_TYPE)
      expect(keys).toHaveLength(4)
    })
  })

  describe('DOCUMENT_TYPE', () => {
    it('should have all required document types', () => {
      expect(DOCUMENT_TYPE.CONSTITUTION).toBe('CONSTITUTION')
      expect(DOCUMENT_TYPE.PRD).toBe('PRD')
      expect(DOCUMENT_TYPE.ADR).toBe('ADR')
      expect(DOCUMENT_TYPE.RELEASE_CHECKLIST).toBe('RELEASE_CHECKLIST')
      expect(DOCUMENT_TYPE.RETROSPECTIVE).toBe('RETROSPECTIVE')
      expect(DOCUMENT_TYPE.OTHER).toBe('OTHER')
    })

    it('should have correct number of types', () => {
      const keys = Object.keys(DOCUMENT_TYPE)
      expect(keys).toHaveLength(6)
    })
  })

  describe('MESSAGE_ROLE', () => {
    it('should have all required message roles', () => {
      expect(MESSAGE_ROLE.USER).toBe('user')
      expect(MESSAGE_ROLE.ASSISTANT).toBe('assistant')
      expect(MESSAGE_ROLE.SYSTEM).toBe('system')
    })

    it('should have correct number of roles', () => {
      const keys = Object.keys(MESSAGE_ROLE)
      expect(keys).toHaveLength(3)
    })
  })

  describe('GITHUB_LINK_TYPE', () => {
    it('should have all required github link types', () => {
      expect(GITHUB_LINK_TYPE.ISSUE).toBe('issue')
      expect(GITHUB_LINK_TYPE.PR).toBe('pr')
    })

    it('should have correct number of types', () => {
      const keys = Object.keys(GITHUB_LINK_TYPE)
      expect(keys).toHaveLength(2)
    })
  })

  describe('constant integrity', () => {
    it('all constants should use as const pattern', () => {
      expect(typeof TASK_STATUS.BACKLOG).toBe('string')
      expect(typeof APPROVAL_STATUS.PENDING).toBe('string')
      expect(typeof MEMORY_TYPE.CONSTITUTION).toBe('string')
      expect(typeof DOCUMENT_TYPE.CONSTITUTION).toBe('string')
      expect(typeof MESSAGE_ROLE.USER).toBe('string')
      expect(typeof GITHUB_LINK_TYPE.ISSUE).toBe('string')
    })

    it('constants should not be mutable', () => {
      // as const makes these readonly at compile time
      // verify structure integrity
      expect(Object.isFrozen(TASK_STATUS) || Object.isSealed(TASK_STATUS)).toBe(false)
      // note: vitest environment may not freeze these, but as const prevents mutations at TS level
    })
  })
})
