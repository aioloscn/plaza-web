import request from '../request';

export const cartApi = {
  /**
   * 同步购物车数据到 Redis
   * @param {Object} data 包含 userId 或 tempUserId，以及 cartItems (JSON string)
   * @returns {Promise}
   */
  syncCart(data) {
    return request.post('/plaza-shop/cart/sync', data);
  },

  /**
   * 从 Redis 获取购物车数据
   * @param {Object} params 包含 userId 或 tempUserId
   * @returns {Promise}
   */
  getCart(params) {
    return request.get('/plaza-shop/cart/get', { params });
  }
};
