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