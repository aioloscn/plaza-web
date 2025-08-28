import { describe, it, expect, beforeEach, vi } from 'vitest'
import { formatDate, formatPrice, debounce, throttle } from '@/utils/index'
import { getToken, setToken, removeToken } from '@/utils/storage'

describe('工具函数测试', () => {
  describe('formatDate', () => {
    it('应该正确格式化日期', () => {
      const date = new Date('2023-12-25 10:30:00')
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2023-12-25')
      expect(formatDate(date, 'YYYY-MM-DD HH:mm:ss')).toBe('2023-12-25 10:30:00')
    })

    it('应该处理无效日期', () => {
      expect(formatDate(null)).toBe('')
      expect(formatDate(undefined)).toBe('')
    })
  })

  describe('formatPrice', () => {
    it('应该正确格式化价格', () => {
      expect(formatPrice(1234.56)).toBe('¥1,234.56')
      expect(formatPrice(0)).toBe('¥0.00')
      expect(formatPrice(null)).toBe('¥0.00')
    })
  })

  describe('debounce', () => {
    it('应该延迟执行函数', async () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)
      
      debouncedFn()
      debouncedFn()
      debouncedFn()
      
      expect(fn).not.toHaveBeenCalled()
      
      await new Promise(resolve => setTimeout(resolve, 150))
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('storage', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it('应该正确存储和获取token', () => {
      const token = 'test-token'
      setToken(token)
      expect(getToken()).toBe(token)
      
      removeToken()
      expect(getToken()).toBeNull()
    })
  })
})