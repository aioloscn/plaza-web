<template>
  <div class="order-list-page">
    <van-nav-bar
      title="我的订单"
      left-arrow
      fixed
      placeholder
      @click-left="$router.go(-1)"
    />

    <van-tabs v-model:active="activeTab" sticky @change="onTabChange">
      <van-tab title="全部" :name="-1"></van-tab>
      <van-tab title="待付款" :name="0"></van-tab>
      <van-tab title="待发货" :name="1"></van-tab>
      <van-tab title="待收货" :name="2"></van-tab>
      <van-tab title="已完成" :name="3"></van-tab>
    </van-tabs>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div class="order-list">
        <div v-if="orders.length === 0 && !loading" class="empty-state">
          <van-empty description="暂无订单" />
        </div>
        
        <div v-else class="order-card" v-for="order in orders" :key="order.id" @click="toDetail(order.id)">
          <div class="card-header">
            <div class="shop-name" @click.stop="toShop(order.shopId)">
              <van-icon name="shop-o" /> {{ order.shopName }}
              <van-icon name="arrow" />
            </div>
            <span class="status">{{ order.statusDesc }}</span>
          </div>
          
          <div class="card-body">
            <div v-for="item in order.items" :key="item.id" class="goods-item">
              <van-image :src="item.productPic" width="60" height="60" radius="4" />
              <div class="goods-info">
                <div class="name">{{ item.productName }}</div>
                <div class="sku">{{ item.productAttr }}</div>
              </div>
              <div class="price-info">
                <div class="price">¥{{ item.productPrice }}</div>
                <div class="count">x{{ item.productQuantity }}</div>
              </div>
            </div>
          </div>
          
          <div class="card-footer">
            <div class="total">
              共{{ getTotalCount(order) }}件商品 合计: <span class="amount">¥{{ order.totalAmount }}</span>
            </div>
            <div class="actions">
              <van-button v-if="order.status === 0" size="small" round plain type="warning" @click.stop="toPay(order.id)">去支付</van-button>
              <van-button v-if="order.status === 2" size="small" round plain type="warning">确认收货</van-button>
              <van-button v-if="order.status === 3" size="small" round plain>评价</van-button>
            </div>
          </div>
        </div>
      </div>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { orderApi } from '@/api';
import { showToast } from 'vant';

const router = useRouter();
const route = useRoute();

const activeTab = ref(-1);
const orders = ref([]);
const loading = ref(false);
const refreshing = ref(false);

const loadOrders = async () => {
  loading.value = true;
  try {
    const status = activeTab.value === -1 ? null : activeTab.value;
    const data = await orderApi.list(status);
    orders.value = data || [];
  } catch (error) {
    console.error(error);
    showToast('加载订单失败');
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

const onTabChange = () => {
  loadOrders();
};

const onRefresh = () => {
  loadOrders();
};

const getTotalCount = (order) => {
  return order.items ? order.items.reduce((sum, item) => sum + item.productQuantity, 0) : 0;
};

const toDetail = (id) => {
  // router.push(`/order/detail/${id}`);
};

const toShop = (shopId) => {
  router.push(`/shop/${shopId}`);
};

const toPay = (id) => {
  router.push(`/pay/${id}`);
};

onMounted(() => {
  // Check URL query for status
  if (route.query.status) {
    activeTab.value = Number(route.query.status);
  }
  loadOrders();
});
</script>

<style scoped lang="scss">
.order-list-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.order-list {
  padding: 10px;
}

.order-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 1px solid #f5f5f5;
    
    .shop-name {
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .status {
      color: #ff9000;
      font-size: 14px;
    }
  }
  
  .card-body {
    padding: 10px 0;
    
    .goods-item {
      display: flex;
      margin-bottom: 10px;
      &:last-child { margin-bottom: 0; }
      
      .goods-info {
        flex: 1;
        margin-left: 10px;
        display: flex;
        flex-direction: column;
        
        .name {
          font-size: 14px;
          line-height: 20px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .sku {
          font-size: 12px;
          color: #999;
          margin-top: 4px;
        }
      }
      
      .price-info {
        text-align: right;
        margin-left: 10px;
        
        .price { font-weight: bold; }
        .count { color: #999; font-size: 12px; margin-top: 4px; }
      }
    }
  }
  
  .card-footer {
    border-top: 1px solid #f5f5f5;
    padding-top: 10px;
    text-align: right;
    
    .total {
      font-size: 12px;
      color: #333;
      margin-bottom: 10px;
      .amount {
        font-size: 16px;
        font-weight: bold;
      }
    }
    
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  }
}
</style>
