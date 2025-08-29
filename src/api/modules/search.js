import request from '../request'

// 首页搜索
export const indexSearch = (params) => {
  return request({
    url: '/indexhome/indexsearch',
    method: 'GET',
    params
  })
}

// 搜索用户
export const searchUser = (params) => {
  return request({
    url: '/indexhome/indexsearch',
    method: 'GET',
    params: {
      type: 2,
      searchtype: 3,
      top: 8,
      ...params
    }
  })
}

// 搜索商家（与shop模块保持一致）
export const searchShops = ({ keyword, longitude, latitude, page = 1, pageSize = 10, categoryId, orderBy }) => {
  const searchData = {
    keyword,
    longitude,
    latitude
  }
  
  // 添加可选参数
  if (categoryId !== undefined && categoryId !== null) {
    searchData.categoryId = categoryId
  }
  
  if (orderBy !== undefined && orderBy !== null) {
    searchData.orderBy = orderBy
  }
  
  return request({
    url: '/plaza-home/shop/search',
    method: 'POST',
    data: {
      page: {
        current: page,
        size: pageSize
      },
      data: searchData
    }
  })
}

// 导出 searchApi 对象
export const searchApi = {
  indexSearch,
  searchUser,
  searchShops
}