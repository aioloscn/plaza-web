import request from '../request'

// 管理后台 - 分类相关
export const searchCategory = (params) => {
  return request({
    url: '/plaza-home/category/list',
    method: 'GET',
    params
  })
}

// 管理后台 - 标签相关
export const getTagsList = (params) => {
  return request({
    url: '/admin/tags/indexjson',
    method: 'GET',
    params
  })
}

export const getTagsCategoryList = (params) => {
  return request({
    url: '/admin/tags/indexcategoryjson',
    method: 'GET',
    params
  })
}

export const createTag = (data) => {
  return request({
    url: '/admin/tags/create',
    method: 'POST',
    data
  })
}

export const createTagCategory = (data) => {
  return request({
    url: '/admin/tags/createcategory',
    method: 'POST',
    data
  })
}

// 管理后台 - 应用相关
export const getApplicationsList = (params) => {
  return request({
    url: '/admin/applications/indexjson',
    method: 'GET',
    params
  })
}

export const createApplication = (data) => {
  return request({
    url: '/admin/applications/create',
    method: 'POST',
    data
  })
}

export const updateApplication = (data) => {
  return request({
    url: '/admin/applications/update',
    method: 'POST',
    data
  })
}

// 管理员登录
export const adminLogin = (data) => {
  return request({
    url: '/admin/admin/login',
    method: 'POST',
    data
  })
}

// 店铺推荐
export const getShopRecommend = (data) => {
  return request({
    url: '/plaza-home/shop/recommend',
    method: 'POST',
    data
  })
}

// 导出 adminApi 对象
export const adminApi = {
  searchCategory,
  getTagsList,
  getTagsCategoryList,
  createTag,
  createTagCategory,
  getApplicationsList,
  createApplication,
  updateApplication,
  adminLogin,
  getShopRecommend
}