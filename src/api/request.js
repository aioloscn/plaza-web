import axios from 'axios'
import { showToast } from 'vant'
import { useUserStore } from '@/store/modules/user'
import { getToken, getRefreshToken, setToken, setRefreshToken } from '@/utils/storage'
import Cookies from 'js-cookie'
import router from '@/router'

// 创建axios实例时，加上 withCredentials: true (参考 live-web)
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  withCredentials: true // 允许跨域携带 cookie
})

// 是否正在刷新token
let isRefreshing = false
// 等待刷新的请求队列
let requestsQueue = []

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 携带 Token (如果存在，且不是占位符)
    const token = getToken()
    if (token && token !== 'session-cookie-auth') {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 尝试携带 device-id (从 cookie 中获取)
    const deviceId = Cookies.get('device-id')
    if (deviceId) {
      config.headers['device-id'] = deviceId
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // badger-user-provider 可能直接返回对象，而不是 { code, data } 结构
    // 如果 response.data 本身就是用户对象（有 id 字段），则直接返回
    if (response.data && response.data.id) {
      return response.data
    }
    
    // 兼容标准结构
    const { code, msg, message, data } = response.data
    
    if (code === 200 || code === undefined) { // 有些接口可能没有 code
      return data || response.data
    } else {
      // 后端返回的可能是 msg，也可能是 message，或者都为空时给默认提示
      const errorMsg = msg || message || '请求失败'
      showToast(errorMsg)
      return Promise.reject(new Error(errorMsg))
    }
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest.url.includes('/user/logout') && !originalRequest.url.includes('badger-user-provider/user/refresh')) {
      const currentToken = getToken()
      const currentRefreshToken = getRefreshToken()
      const userStore = useUserStore()

      // 1. 如果存在 Refresh Token，则尝试无感刷新
      if (currentToken && currentRefreshToken) {
        if (!isRefreshing) {
          isRefreshing = true
          try {
            // 发起刷新请求，注意要用一个新的 axios 实例或者直接写 fetch 避免被再次拦截
            const refreshResponse = await axios.post(
              `${import.meta.env.VITE_API_BASE_URL || '/api'}/badger-user-provider/user/refresh`, 
              `refreshToken=${currentRefreshToken}`,
              { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            )
            
            const newTokens = refreshResponse.data.data || refreshResponse.data
            if (newTokens && newTokens.accessToken) {
              // 更新本地存储和 Store
              setToken(newTokens.accessToken)
              setRefreshToken(newTokens.refreshToken)
              userStore.token = newTokens.accessToken
              
              // 重新执行队列中的请求
              requestsQueue.forEach(cb => cb(newTokens.accessToken))
              requestsQueue = []
              
              // 重试当前失败的请求
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`
              return request(originalRequest)
            } else {
              throw new Error('Invalid refresh response')
            }
          } catch (refreshError) {
            // 刷新失败，强制退出
            requestsQueue = []
            userStore.logoutAction()
            showToast('登录已过期，请重新登录')
            return Promise.reject(refreshError)
          } finally {
            isRefreshing = false
          }
        } else {
          // 如果正在刷新中，将请求加入队列，等待刷新完成后重试
          return new Promise(resolve => {
            requestsQueue.push((newToken) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              resolve(request(originalRequest))
            })
          })
        }
      } else {
        // 2. 没有 Refresh Token，或者是未登录状态访问
        if (currentToken) {
          // 有 token 但没 refresh token（异常情况），强制登出
          userStore.logoutAction()
          showToast('登录状态异常，请重新登录')
        }
        // 如果根本没有 token，说明是游客，不弹窗，直接拒绝，交由业务方处理
      }
    } else if (error.response?.status === 401 && error.config.url.includes('/user/logout')) {
      // 如果就是 logout 接口报 401，强制清空本地状态
      const userStore = useUserStore()
      userStore.token = ''
      userStore.userInfo = {}
      localStorage.removeItem('plaza_token')
      localStorage.removeItem('plaza_refresh_token')
    } else {
      showToast(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request