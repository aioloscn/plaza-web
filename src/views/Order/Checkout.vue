<template>
  <div class="checkout-page">
    <van-nav-bar
      title="确认订单"
      left-arrow
      @click-left="$router.go(-1)"
    />

    <!-- Address Section -->
    <div class="address-section" @click="onSelectAddress">
      <div v-if="currentAddress" class="address-content">
        <div class="info">
          <span class="name">{{ currentAddress.name }}</span>
          <span class="tel">{{ currentAddress.tel }}</span>
        </div>
        <div class="detail">{{ currentAddress.address }}</div>
      </div>
      <div v-else class="address-empty">
        请选择收货地址
      </div>
      <van-icon name="arrow" />
    </div>

    <!-- Shop & Items -->
    <div class="shop-group">
      <div class="shop-name">
        <van-icon name="shop-o" /> {{ shopName }}
      </div>
      <div v-for="item in cartItems" :key="item.productId" class="goods-item">
        <van-image :src="item.image" width="60" height="60" radius="4" />
        <div class="goods-info">
          <div class="name">{{ item.productName }}</div>
          <div class="price-row">
            <span class="price">¥{{ item.price }}</span>
            <span class="count">x{{ item.quantity }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Submit Bar -->
    <van-submit-bar
      :price="totalPrice * 100"
      button-text="提交订单"
      @submit="onSubmit"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCartStore } from '@/store/modules/cart';
import { useUserStore } from '@/store/modules/user';
import { addressApi } from '@/api';
import { showToast } from 'vant';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const userStore = useUserStore();

const shopId = route.params.shopId;
const currentAddress = ref(null);

const cartItems = computed(() => cartStore.getShopCartItems(shopId));
const totalPrice = computed(() => Number(cartStore.getShopCartTotal(shopId)));
const shopName = computed(() => cartItems.value.length > 0 ? cartItems.value[0].shopName : '');

const loadAddress = async () => {
  // 如果没有用户信息，可能还没获取完，先尝试获取
  if (!userStore.userInfo?.id) {
      try {
          await userStore.getUserInfoAction();
      } catch (e) {
          showToast('请先登录');
          return;
      }
  }

  // Check if address selected from list
  const selectedId = sessionStorage.getItem('selected_address_id');
  if (selectedId) {
      try {
          const { data } = await addressApi.get(selectedId);
          currentAddress.value = {
              ...data,
              address: `${data.province}${data.city}${data.county}${data.addressDetail}`
          };
          return;
      } catch (e) {}
  }
  
  // Default load default address
  try {
      // 这里的 addressApi.list() 不需要传 userId，后端自己取
      const data = await addressApi.list();
      
      // 兼容直接返回数组或者 { data: [] }
      let list = [];
      if (Array.isArray(data)) {
          list = data;
      } else if (data && Array.isArray(data.data)) {
          list = data.data;
      } else if (data && Array.isArray(data.records)) {
          list = data.records;
      }

      if (list && list.length > 0) {
        const defaultAddr = list.find(item => item.isDefault) || list[0];
        if (defaultAddr) {
            currentAddress.value = {
                ...defaultAddr,
                address: `${defaultAddr.province}${defaultAddr.city}${defaultAddr.county}${defaultAddr.addressDetail}`
            };
        }
      }
  } catch (e) {
      console.error('加载地址失败', e);
  }
};

const onSelectAddress = () => {
    router.push('/address/list?select=true');
};

const onSubmit = () => {
    if (!currentAddress.value) {
        showToast('请选择收货地址');
        return;
    }
    showToast('下单功能开发中...');
};

onMounted(() => {
    loadAddress();
});
</script>

<style scoped lang="scss">
.checkout-page {
    min-height: 100vh;
    background: #f7f8fa;
    padding-bottom: 50px;
}
.address-section {
    background: #fff;
    padding: 15px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .address-content {
        flex: 1;
        .info {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
            .tel { margin-left: 10px; color: #666; font-size: 14px; font-weight: normal; }
        }
        .detail { color: #333; font-size: 14px; }
    }
    .address-empty {
        font-size: 16px; color: #333;
    }
}
.shop-group {
    background: #fff;
    margin: 10px;
    border-radius: 8px;
    padding: 10px;
    
    .shop-name {
        font-weight: bold;
        padding-bottom: 10px;
        border-bottom: 1px solid #f5f5f5;
        margin-bottom: 10px;
    }
    
    .goods-item {
        display: flex;
        margin-bottom: 10px;
        .goods-info {
            flex: 1;
            margin-left: 10px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            .name { font-size: 14px; }
            .price-row {
                display: flex; justify-content: space-between;
                .price { color: #f44; font-weight: bold; }
                .count { color: #999; }
            }
        }
    }
}
</style>
