import request from '../request';

export const addressApi = {
  list() {
    return request.get('/plaza-shop/address/list');
  },
  add(data) {
    return request.post('/plaza-shop/address/add', data);
  },
  update(data) {
    return request.put('/plaza-shop/address/update', data);
  },
  delete(id) {
    return request.delete(`/plaza-shop/address/${id}`);
  },
  get(id) {
    return request.get(`/plaza-shop/address/${id}`);
  }
};
