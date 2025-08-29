const TOKEN_KEY = 'plaza_token'
const USER_KEY = 'plaza_user'

// Token相关
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY)
}

// 用户信息相关
export const getUser = () => {
  const user = localStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

export const setUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const removeUser = () => {
  localStorage.removeItem(USER_KEY)
}

// 地理位置缓存相关
const LOCATION_KEY = 'plaza_location'
const LOCATION_CACHE_DURATION = 30 * 60 * 1000 // 30分钟缓存时间

export const getLocationCache = () => {
  const cache = localStorage.getItem(LOCATION_KEY)
  if (!cache) return null
  
  try {
    const { location, timestamp } = JSON.parse(cache)
    const now = Date.now()
    
    // 检查缓存是否过期
    if (now - timestamp > LOCATION_CACHE_DURATION) {
      localStorage.removeItem(LOCATION_KEY)
      return null
    }
    
    return location
  } catch (error) {
    console.error('解析位置缓存失败:', error)
    localStorage.removeItem(LOCATION_KEY)
    return null
  }
}

export const setLocationCache = (location) => {
  const cache = {
    location,
    timestamp: Date.now()
  }
  localStorage.setItem(LOCATION_KEY, JSON.stringify(cache))
}

export const removeLocationCache = () => {
  localStorage.removeItem(LOCATION_KEY)
}