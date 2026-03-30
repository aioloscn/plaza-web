const TOKEN_KEY = 'plaza_token'
const REFRESH_TOKEN_KEY = 'plaza_refresh_token'
const USER_KEY = 'plaza_user'
const GLOBAL_LOGOUT_COOKIE_KEY = 'aiolos_sso_logout_at'
const GLOBAL_LOGOUT_SEEN_KEY = 'plaza_seen_logout_at'

const readCookieValue = (name) => {
  if (typeof document === 'undefined') return ''
  const cookies = document.cookie ? document.cookie.split('; ') : []
  for (const item of cookies) {
    const idx = item.indexOf('=')
    const key = idx > -1 ? item.slice(0, idx) : item
    if (key === name) {
      return idx > -1 ? decodeURIComponent(item.slice(idx + 1)) : ''
    }
  }
  return ''
}

const consumeGlobalLogoutMarker = () => {
  if (typeof window === 'undefined') return
  const marker = parseInt(readCookieValue(GLOBAL_LOGOUT_COOKIE_KEY) || '0', 10)
  if (!marker) return
  const seen = parseInt(localStorage.getItem(GLOBAL_LOGOUT_SEEN_KEY) || '0', 10)
  if (seen >= marker) return
  localStorage.setItem(GLOBAL_LOGOUT_SEEN_KEY, String(marker))
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

const consumeAuthFromUrl = () => {
  if (typeof window === 'undefined') {
    return {
      token: '',
      refreshToken: ''
    }
  }

  const url = new URL(window.location.href)
  const token = (url.searchParams.get('token') || '').trim()
  const refreshToken = (url.searchParams.get('refreshToken') || '').trim()

  if (!token && !refreshToken) {
    return {
      token: '',
      refreshToken: ''
    }
  }

  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }

  url.searchParams.delete('token')
  url.searchParams.delete('refreshToken')

  const nextUrl = `${url.pathname}${url.search}${url.hash}`
  window.history.replaceState({}, document.title, nextUrl)

  return {
    token,
    refreshToken
  }
}

// Token相关
export const getToken = () => {
  consumeGlobalLogoutMarker()
  const urlAuth = consumeAuthFromUrl()
  let token = localStorage.getItem(TOKEN_KEY)
  if (urlAuth.token && urlAuth.token !== token) {
    token = urlAuth.token
  }
  return token || ''
}

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY)
}

export const getRefreshToken = () => {
  consumeGlobalLogoutMarker()
  const urlAuth = consumeAuthFromUrl()
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  return urlAuth.refreshToken || refreshToken || ''
}

export const setRefreshToken = (token) => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export const removeRefreshToken = () => {
  localStorage.removeItem(REFRESH_TOKEN_KEY)
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
