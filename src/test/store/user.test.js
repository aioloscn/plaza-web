import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/store/modules/user'
import * as authApi from '@/api/modules/auth'

// 模拟 API
vi.mock('@/api/modules/auth', () => ({
  login: vi.fn(),
  getUserInfo: vi.fn(),
  logout: vi.fn()
}))

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('应该正确初始化状态', () => {
    const userStore = useUserStore()
    
    expect(userStore.token).toBe('')
    expect(userStore.userInfo).toEqual({})
    expect(userStore.isLoggedIn).toBe(false)
  })

  it('应该正确处理登录', async () => {
    const userStore = useUserStore()
    const mockResponse = {
      data: {
        token: 'test-token',
        user: { id: 1, name: '测试用户' }
      }
    }
    
    authApi.login.mockResolvedValue(mockResponse)
    
    await userStore.loginAction({ username: 'test', password: '123456' })
    
    expect(userStore.token).toBe('test-token')
    expect(userStore.userInfo).toEqual({ id: 1, name: '测试用户' })
    expect(userStore.isLoggedIn).toBe(true)
  })

  it('应该正确处理登出', async () => {
    const userStore = useUserStore()
    userStore.token = 'test-token'
    userStore.userInfo = { id: 1, name: '测试用户' }
    
    await userStore.logoutAction()
    
    expect(userStore.token).toBe('')
    expect(userStore.userInfo).toEqual({})
    expect(userStore.isLoggedIn).toBe(false)
  })
})