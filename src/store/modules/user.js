import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getUserInfo } from '@/api/modules/auth'
import { setToken, getToken, removeToken } from '@/utils/storage'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref(getToken() || '')
  const userInfo = ref({})
  const isLoggedIn = computed(() => !!token.value)

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
  const getUserInfoAction = async () => {
    try {
      const response = await getUserInfo()
      userInfo.value = response.data
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