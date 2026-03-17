import request from '../request';

export const cartApi = {
  addCart(data) {
    return request.post('/plaza-cart/cart/add', data);
  },
  updateQuantity(data) {
    return request.post('/plaza-cart/cart/update', data);
  },
  deleteCartItem(productId) {
    return request.post('/plaza-cart/cart/delete', null, { params: { productId } });
  },
  checkCartItem(data) {
    return request.post('/plaza-cart/cart/check', data);
  },
  getCartList() {
    return request.get('/plaza-cart/cart/list');
  },
  mergeCart() {
    return request.post('/plaza-cart/cart/merge');
  },
  clearInvalid() {
    return request.post('/plaza-cart/cart/clearInvalid');
  }
};