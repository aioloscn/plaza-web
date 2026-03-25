import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getUserInfo, getSmsCode, getCurrentUser } from '@/api/modules/auth'
import { setToken, getToken, removeToken, setRefreshToken, getRefreshToken, removeRefreshToken } from '@/utils/storage'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref(getToken() || '')
  const refreshToken = ref(getRefreshToken() || '')
  const userInfo = ref({})
  const isLoggedIn = computed(() => {
    // 优先看 token
    const currentToken = getToken()
    if (currentToken && currentToken !== token.value) {
      token.value = currentToken
    }
    
    // 如果 token 有值，肯定是登录了
    if (!!token.value) return true;
    
    // 如果 token 没值，但是 userInfo 有 userId，说明是通过 cookie 登录的
    if (userInfo.value && userInfo.value.userId) return true;
    
    return false
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
      // 场景2：直接返回 UserVO 对象 (Cookie/Session 模式)
      else if (data && data.userId) {
        userInfo.value = data
        token.value = 'session-cookie-auth' // 设置占位 token
        // setToken('session-cookie-auth') // 不再需要写入 localStorage，依赖 getUserInfoAction 恢复状态
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
      
      // 如果获取用户信息成功，但本地没有 token (可能是 HttpOnly Cookie 模式)
      // 我们手动设置一个占位 token，确保 isLoggedIn 为 true
      if (!token.value && userData.userId) {
        token.value = 'session-cookie-auth'
      }
      
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

  return {
    token,
    userInfo,
    isLoggedIn,
    loginAction,
    logoutAction,
    getUserInfoAction,
    sendSmsCodeAction
  }
})