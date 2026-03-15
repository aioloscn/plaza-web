import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getUserInfo } from '@/api/modules/auth'
import { setToken, getToken, removeToken } from '@/utils/storage'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref(getToken() || '')
  const userInfo = ref({})
  const isLoggedIn = computed(() => {
    // 优先看 token
    const currentToken = getToken()
    if (currentToken && currentToken !== token.value) {
      token.value = currentToken
    }
    
    // 如果 token 有值，肯定是登录了
    if (!!token.value) return true;
    
    // 如果 token 没值，但是 userInfo 有 id，说明可能是通过 cookie 登录的
    if (userInfo.value && userInfo.value.id) return true;
    
    return false
  })

  // 登录
  const loginAction = async (loginForm) => {
    try {
      const response = await login(loginForm)
      const { token: newToken, user } = response.data
      
      token.value = newToken
      userInfo.value = user
      setToken(newToken)
      
      return Promise.resolve(response)
    } catch (error) {
      return Promise.reject(error)
    }
  }

  // 登出
  const logoutAction = async () => {
    try {
      await logout()
      token.value = ''
      userInfo.value = {}
      removeToken()
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  // 获取用户信息
  const getUserInfoAction = async (userId) => {
    try {
      const response = await getUserInfo(userId)
      userInfo.value = response // 注意：后端返回直接是 UserVO，没有 data 包装？或者 response 拦截器处理了
      
      // 如果获取用户信息成功，但本地没有 token (可能是 HttpOnly Cookie 模式)
      // 我们手动设置一个占位 token，确保 isLoggedIn 为 true
      if (!token.value) {
        token.value = 'session-cookie-auth'
      }
      
      return response
    } catch (error) {
      return Promise.reject(error)
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    loginAction,
    logoutAction,
    getUserInfoAction
  }
})