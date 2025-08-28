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
    return request.get('/shop/recommend', {
      params: {
        longitude,
        latitude
      }
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
   * @param {Object} params 搜索参数
   * @returns {Promise}
   */
  searchShops(params) {
    return request.get('/shop/search', { params });
  }
};