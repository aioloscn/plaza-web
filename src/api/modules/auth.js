import request from '../request'

// 用户登录
export const login = (data) => {
  return request({
    url: '/user/login',
    method: 'POST',
    data
  })
}

// 用户注册
export const register = (data) => {
  return request({
    url: '/user/register',
    method: 'POST',
    data
  })
}

// 获取用户信息
export const getUserInfo = () => {
  return request({
    url: '/user/info',
    method: 'GET'
  })
}

// 用户登出
export const logout = () => {
  return request({
    url: '/user/logout',
    method: 'POST'
  })
}

// 导出 authApi 对象
export const authApi = {
  login,
  register,
  getUserInfo,
  logout
}