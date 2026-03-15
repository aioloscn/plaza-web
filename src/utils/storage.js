import Cookies from 'js-cookie'

const TOKEN_KEY = 'plaza_token'
const USER_KEY = 'plaza_user'

// Token相关
export const getToken = () => {
  // 1. 尝试从 cookie 获取 (解决跨域登录的 token 共享问题)
  // live-web 中种的 cookie 叫 ztscrip，而截图里看到的是 vs-token。我们都尝试取一下
  let token = Cookies.get('vs-token') || Cookies.get('token') || Cookies.get('ztscrip')

  // 2. 如果 Cookie 中没有，再尝试从 localStorage 获取
  if (!token) {
    token = localStorage.getItem(TOKEN_KEY)
  } else {
    // 如果 Cookie 中有，同步更新到 localStorage
    localStorage.setItem(TOKEN_KEY, token)
  }
  
  // 3. 尝试从 URL 中获取 (解决 cookie domain 没生效的情况，这是最可靠的兜底)
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    
    // 如果 URL 中直接带有 token
    const tokenFromUrl = urlParams.get('token');
    if (tokenFromUrl && tokenFromUrl !== token) {
       token = tokenFromUrl;
       localStorage.setItem(TOKEN_KEY, token);
       Cookies.set('vs-token', token, { path: '/', domain: '.aiolos.com' });
       window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 如果是 badger-web 回跳，通常只带有 loginStatus=success
    const loginStatus = urlParams.get('loginStatus');
    if (loginStatus === 'success') {
       // 再读一次，确保没漏
       const cToken = Cookies.get('vs-token') || Cookies.get('token') || Cookies.get('ztscrip');
       if(cToken) {
          token = cToken;
          localStorage.setItem(TOKEN_KEY, token);
       }
    }
  }

  return token || ''
}

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token)
  // 为了跨域共享，设置 domain
  Cookies.set('vs-token', token, { path: '/', domain: '.aiolos.com' })
}

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY)
  Cookies.remove('vs-token', { path: '/', domain: '.aiolos.com' })
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