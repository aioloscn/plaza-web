import request from '../request';

/**
 * 商家相关API
 */
export const shopApi = {
  /**
   * 根据位置推荐商家
   * @param {number} longitude 经度
   * @param {number} latitude 纬度
   * @returns {Promise}
   */
  getRecommendShops(longitude, latitude) {
    return request.post('/plaza-home/shop/recommend', {
      longitude,
      latitude
    });
  },

  /**
   * 获取商家详情
   * @param {string} shopId 商家ID
   * @returns {Promise}
   */
  getShopDetail(shopId) {
    return request.get(`/shop/${shopId}`);
  },

  /**
   * 搜索商家
   * @param {string} keyword 搜索关键词
   * @param {number} longitude 经度
   * @param {number} latitude 纬度
   * @param {number} page 页码，默认1
   * @param {number} pageSize 每页数量，默认10
   * @param {string} categoryId 分类ID
   * @param {string} orderBy 排序方式
   * @param {string} tag 标签筛选
   * @returns {Promise}
   */
  searchShops({ keyword, longitude, latitude, page = 1, pageSize = 10, categoryId, orderBy, tag }) {
    const searchData = {
      keyword,
      longitude,
      latitude
    };
    
    // 添加可选参数
    if (categoryId !== undefined && categoryId !== null) {
      searchData.categoryId = categoryId;
    }
    
    if (orderBy !== undefined && orderBy !== null) {
      searchData.orderBy = orderBy;
    }
    
    if (tag !== undefined && tag !== null && tag !== '') {
      searchData.tag = tag;
    }
    
    return request.post('/plaza-home/shop/searchES', {
      page: {
        current: page,
        size: pageSize
      },
      data: searchData
    });
  }
};