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

// 导出 searchApi 对象
export const searchApi = {
  indexSearch,
  searchUser
}