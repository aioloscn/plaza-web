import request from '../request';

export const orderApi = {
  submit(data) {
    return request.post('/plaza-order/order/submit', data);
  },
  submitSeckill(data) {
    return request.post('/plaza-order/seckill/submit', data);
  },
  getPayInfo(paySn) {
    return request.get('/plaza-order/order/payInfo', { params: { paySn } });
  },
  pay(orderSn, payType = 1) {
    return request.post('/plaza-order/order/pay', null, {
      params: { orderSn, payType }
    });
  },
  get(id) {
    return request.get(`/plaza-order/order/${id}`);
  },
  list(status) {
    return request.get('/plaza-order/order/list', { params: { status } });
  }
};
