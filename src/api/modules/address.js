import request from '../request';

export const addressApi = {
  list() {
    return request.get('/plaza-order/address/list');
  },
  add(data) {
    return request.post('/plaza-order/address/add', data);
  },
  update(data) {
    return request.put('/plaza-order/address/update', data);
  },
  delete(id) {
    return request.delete(`/plaza-order/address/${id}`);
  },
  get(id) {
    return request.get(`/plaza-order/address/${id}`);
  }
};
