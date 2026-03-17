import axios from 'axios'
import { showToast } from 'vant'
import { useUserStore } from '@/store/modules/user'
import { getToken } from '@/utils/storage'
import Cookies from 'js-cookie'

// 创建axios实例时，加上 withCredentials: true (参考 live-web)
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  withCredentials: true // 允许跨域携带 cookie
})

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
  (error) => {
    if (error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.logoutAction()
      showToast('登录已过期，请重新登录')
    } else {
      showToast(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request