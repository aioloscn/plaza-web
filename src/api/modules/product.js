import request from '../request';

/**
 * 商品相关API
 */
export const productApi = {
  /**
   * 根据店铺ID查询商品列表
   * @param {number|string} shopId 店铺ID
   * @returns {Promise}
   */
  getProductList(shopId) {
    return request.get('/plaza-shop/product/list', {
      params: {
        shopId
      }
    });
  },

  /**
   * 根据ID查询商品详情
   * @param {number|string} id 商品ID
   * @returns {Promise}
   */
  getProductDetail(id) {
    return request.get(`/plaza-shop/product/${id}`);
  }
};
