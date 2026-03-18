<template>
  <div class="pay-page">
    <van-nav-bar
      title="收银台"
      left-arrow
      @click-left="$router.go(-1)"
    />
    
    <div class="pay-amount">
      <div class="label">支付金额</div>
      <div class="amount">¥{{ orderInfo.payAmount || '0.00' }}</div>
    </div>
    
    <div class="pay-type-list">
      <van-radio-group v-model="payType">
        <van-cell-group>
          <van-cell title="支付宝支付" clickable @click="payType = '1'">
            <template #icon>
              <van-icon name="alipay" class="pay-icon alipay" />
            </template>
            <template #right-icon>
              <van-radio name="1" />
            </template>
          </van-cell>
          <van-cell title="微信支付" clickable @click="payType = '2'">
            <template #icon>
              <van-icon name="wechat-pay" class="pay-icon wechat" />
            </template>
            <template #right-icon>
              <van-radio name="2" />
            </template>
          </van-cell>
        </van-cell-group>
      </van-radio-group>
    </div>
    
    <div class="submit-btn">
      <van-button type="primary" block round @click="handlePay" :loading="loading">
        立即支付
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { orderApi } from '@/api';
import { showToast, showSuccessToast } from 'vant';

const route = useRoute();
const router = useRouter();
const orderId = route.params.id;
const paySn = route.query.sn;

const orderInfo = ref({});
const payType = ref('1');
const loading = ref(false);

const loadOrder = async () => {
  loading.value = true;
  try {
    let data;
    if (paySn) {
      data = await orderApi.getPayInfo(paySn);
    } else {
      data = await orderApi.get(orderId);
    }
    // If data is wrapped
    orderInfo.value = data.data || data;
  } catch (error) {
    showToast('获取订单信息失败');
  } finally {
    loading.value = false;
  }
};

const handlePay = async () => {
  loading.value = true;
  try {
    // 模拟支付过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 实际项目中这里应该调用支付接口获取支付参数，然后调起支付
    // 这里直接模拟支付成功
    showSuccessToast('支付成功');
    
    setTimeout(() => {
      router.replace('/order/list?status=1'); // 跳转到待发货列表
    }, 1500);
  } catch (error) {
    showToast('支付失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadOrder();
});
</script>

<style scoped lang="scss">
.pay-page {
  min-height: 100vh;
  background: #f7f8fa;
  
  .pay-amount {
    background: #fff;
    padding: 40px 0;
    text-align: center;
    margin-bottom: 10px;
    
    .label {
      color: #666;
      font-size: 14px;
      margin-bottom: 10px;
    }
    
    .amount {
      font-size: 36px;
      font-weight: bold;
      color: #333;
    }
  }
  
  .pay-type-list {
    margin-bottom: 30px;
    
    .pay-icon {
      font-size: 24px;
      margin-right: 10px;
      
      &.alipay { color: #1677ff; }
      &.wechat { color: #07c160; }
    }
  }
  
  .submit-btn {
    padding: 0 16px;
  }
}
</style>
