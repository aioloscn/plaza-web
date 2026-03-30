import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getUserInfo, getSmsCode, getCurrentUser, changePasswordBySms } from '@/api/modules/auth'
import { setToken, getToken, removeToken, setRefreshToken, getRefreshToken, removeRefreshToken } from '@/utils/storage'
import { buildOAuthLogoutUrl, publishGlobalLogoutMarker } from '@/utils/oauth2'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref(getToken() || '')
  const refreshToken = ref(getRefreshToken() || '')
  const userInfo = ref({})
  const isLoggedIn = computed(() => {
    const currentToken = getToken()
    if (currentToken && currentToken !== token.value) {
      token.value = currentToken
    }
    return !!token.value
  })

  // 登录
  const loginAction = async (loginForm) => {
    try {
      const response = await login(loginForm)
      
      // 兼容多种后端返回格式
      const data = response.data || response
      
      // 场景1：返回 { token: 'xxx', user: {...} } 或直接返回带有 token 字段的 UserVO 对象
      if (data && data.token) {
        token.value = data.token
        if (data.refreshToken) {
          refreshToken.value = data.refreshToken
          setRefreshToken(data.refreshToken)
        }
        // 如果后端直接把 token 塞在了 UserVO 里（像我们刚才改造的），那么 data 本身就是 userInfo
        userInfo.value = data.user || data
        setToken(data.token)
      } 
      // 场景2：直接返回 UserVO 对象
      else if (data && data.userId) {
        userInfo.value = data
      }
      // 场景3：只返回 code=200，没有数据
      else {
        // 尝试获取一次用户信息来确认登录状态
        await getUserInfoAction()
      }
      
      return Promise.resolve(response)
    } catch (error) {
      return Promise.reject(error)
    }
  }

  // 登出
  const logoutAction = async () => {
    try {
      // 无论后端登出接口是否成功，前端必须先清理状态，防止拦截器死循环
      token.value = ''
      refreshToken.value = ''
      userInfo.value = {}
      removeToken()
      removeRefreshToken()
      await logout()
    } catch (error) {
      console.error('登出请求失败:', error)
    }
  }

  const oauthLogoutAction = async (redirectPath = '/') => {
    await logoutAction()
    publishGlobalLogoutMarker()
    window.location.href = buildOAuthLogoutUrl(redirectPath)
  }

  // 获取用户信息
  const getUserInfoAction = async (userId) => {
    try {
      let userData
      
      if (userId) {
        // 获取指定用户信息
        const response = await getUserInfo(userId)
        userData = response.data || response
      } else {
        // 获取当前登录用户信息
        const response = await getCurrentUser()
        userData = response.data || response
      }
      
      userInfo.value = userData
      
      return userData
    } catch (error) {
      return Promise.reject(error)
    }
  }

  // 发送短信验证码
  const sendSmsCodeAction = async (phone) => {
    try {
      const response = await getSmsCode(phone)
      return Promise.resolve(response)
    } catch (error) {
      return Promise.reject(error)
    }
  }

  const changePasswordBySmsAction = async (form) => {
    try {
      const response = await changePasswordBySms(form)
      return Promise.resolve(response)
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
    oauthLogoutAction,
    getUserInfoAction,
    sendSmsCodeAction,
    changePasswordBySmsAction
  }
})
