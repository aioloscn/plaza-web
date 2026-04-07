import request from '../request';

export const orderApi = {
  confirm(data) {
    return request.post('/plaza-order/order/confirm', data);
  },
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
    return request.post('/plaza-order/payment/pay', null, {
      params: { orderSn, payType }
    });
  },
  refund(parentOrderSn) {
    return request.post('/plaza-order/payment/refund', null, {
      params: { parentOrderSn }
    });
  },
  get(id) {
    return request.get(`/plaza-order/order/${id}`);
  },
  list(status) {
    return request.get('/plaza-order/order/list', { params: { status } });
  }
};
