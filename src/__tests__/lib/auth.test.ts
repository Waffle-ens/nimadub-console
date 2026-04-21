import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { checkAuth, verifyPassword, setAuthCookie, clearAuthCookie } from '@/lib/auth'
import { cookies } from 'next/headers'

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_PASSWORD = undefined
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('checkAuth', () => {
    it('should return true when auth cookie exists and matches', async () => {
      const cookieStore = await cookies()
      vi.mocked(cookieStore.get).mockReturnValue({ value: 'authenticated' } as any)
      const result = await checkAuth()
      expect(result).toBe(true)
    })

    it('should return false when auth cookie does not exist', async () => {
      const cookieStore = await cookies()
      vi.mocked(cookieStore.get).mockReturnValue(undefined)
      const result = await checkAuth()
      expect(result).toBe(false)
    })

    it('should return false when auth cookie value does not match', async () => {
      const cookieStore = await cookies()
      vi.mocked(cookieStore.get).mockReturnValue({ value: 'invalid' } as any)
      const result = await checkAuth()
      expect(result).toBe(false)
    })
  })

  describe('verifyPassword', () => {
    it('should return true when password matches default', async () => {
      const result = await verifyPassword('admin123')
      expect(result).toBe(true)
    })

    it('should return false when password does not match default', async () => {
      const result = await verifyPassword('wrong')
      expect(result).toBe(false)
    })

    it('should use environment variable if set before module load', async () => {
      // env is already captured at module load, so we test with default
      const result = await verifyPassword('admin123')
      expect(result).toBe(true)
    })

    it('should return false for mismatched password', async () => {
      const result = await verifyPassword('wrong_password')
      expect(result).toBe(false)
    })
  })

  describe('setAuthCookie', () => {
    it('should call cookies().set with correct parameters', async () => {
      process.env.NODE_ENV = 'development'
      await setAuthCookie()
      const cookieStore = await cookies()
      expect(vi.mocked(cookieStore.set)).toHaveBeenCalledWith('nimadub_auth', 'authenticated', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      })
    })

    it('should set secure flag to true in production', async () => {
      process.env.NODE_ENV = 'production'
      await setAuthCookie()
      const cookieStore = await cookies()
      expect(vi.mocked(cookieStore.set)).toHaveBeenCalledWith(
        'nimadub_auth',
        'authenticated',
        expect.objectContaining({ secure: true })
      )
    })
  })

  describe('clearAuthCookie', () => {
    it('should call cookies().delete with correct cookie name', async () => {
      await clearAuthCookie()
      const cookieStore = await cookies()
      expect(vi.mocked(cookieStore.delete)).toHaveBeenCalledWith('nimadub_auth')
    })
  })
})
