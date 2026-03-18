import request from '../request';

export const orderApi = {
  submit(data) {
    return request.post('/plaza-order/order/submit', data);
  },
  getPayInfo(paySn) {
    return request.get('/plaza-order/order/payInfo', { params: { paySn } });
  },
  get(id) {
    return request.get(`/plaza-order/order/${id}`);
  },
  list(status) {
    return request.get('/plaza-order/order/list', { params: { status } });
  }
};
