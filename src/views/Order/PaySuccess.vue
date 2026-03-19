<template>
  <div class="pay-success-page">
    <van-nav-bar
      title="支付结果"
      left-arrow
      @click-left="goHome"
    />
    
    <div class="result-container">
      <van-icon name="checked" class="success-icon" />
      <div class="title">支付成功</div>
      
      <div class="info-list" v-if="orderInfo">
        <div class="info-item">
          <span class="label">支付单号</span>
          <span class="value">{{ out_trade_no }}</span>
        </div>
        <div class="info-item">
          <span class="label">支付金额</span>
          <span class="value price">¥{{ orderInfo.payAmount || '0.00' }}</span>
        </div>
      </div>
      
      <div class="action-btns">
        <van-button type="primary" block round @click="viewOrder">查看订单</van-button>
        <van-button block round class="home-btn" @click="goHome">返回首页</van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { orderApi } from '@/api';
import { showToast } from 'vant';

const route = useRoute();
const router = useRouter();

// Alipay callback query parameters
const out_trade_no = route.query.out_trade_no;

const orderInfo = ref(null);

const loadOrderInfo = async () => {
  if (!out_trade_no) return;
  try {
    // We can fetch order info by out_trade_no (which is paySn)
    const res = await orderApi.getPayInfo(out_trade_no);
    orderInfo.value = res.data || res;
  } catch (error) {
    console.error('Failed to get order info', error);
  }
};

const viewOrder = () => {
  // Go to order list or specific order detail
  router.replace('/order/list');
};

const goHome = () => {
  router.replace('/');
};

onMounted(() => {
  loadOrderInfo();
});
</script>

<style scoped lang="scss">
.pay-success-page {
  min-height: 100vh;
  background: #f7f8fa;
  
  .result-container {
    background: #fff;
    padding: 40px 20px;
    text-align: center;
    margin-bottom: 10px;
    
    .success-icon {
      font-size: 64px;
      color: #07c160;
      margin-bottom: 16px;
    }
    
    .title {
      font-size: 20px;
      font-weight: bold;
      color: #333;
      margin-bottom: 30px;
    }
    
    .info-list {
      text-align: left;
      background: #f8f8f8;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 30px;
      
      .info-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .label {
          color: #666;
          font-size: 14px;
        }
        
        .value {
          color: #333;
          font-size: 14px;
          
          &.price {
            color: #ee0a24;
            font-weight: bold;
          }
        }
      }
    }
    
    .action-btns {
      .home-btn {
        margin-top: 16px;
        border: 1px solid #ebedf0;
      }
    }
  }
}
</style>