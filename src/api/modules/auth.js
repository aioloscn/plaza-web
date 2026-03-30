import request from '../request'

// 用户登录
export const login = (data) => {
  return request({
    url: '/badger-user-provider/user/login',
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

// 获取当前用户信息（通过 Session/Token）
export const getCurrentUser = () => {
  return request({
    url: '/badger-user-provider/user/query-user',
    method: 'GET'
  })
}

// 获取用户信息
export const getUserInfo = (userId) => {
  if (userId) {
    return request({
      url: '/badger-user-provider/user/get-user-by-id',
      method: 'GET',
      params: { userId }
    })
  } else {
    return getCurrentUser()
  }
}

// 获取验证码
export const getSmsCode = (phone) => {
  const formData = new FormData()
  formData.append('phone', phone)
  
  return request({
    url: '/badger-sms-provider/sms/send-sms',
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data: formData
  })
}

// 用户登出
export const logout = () => {
  return request({
    url: '/badger-user-provider/user/logout',
    method: 'POST'
  })
}

export const changePasswordBySms = (data) => {
  return request({
    url: '/badger-user-provider/user/change-password-by-sms',
    method: 'POST',
    data
  })
}

// 导出 authApi 对象
export const authApi = {
  login,
  register,
  getUserInfo,
  getCurrentUser,
  getSmsCode,
  logout,
  changePasswordBySms
}
