<template>
  <div class="checkout-page">
    <van-nav-bar
      title="确认秒杀订单"
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

    <!-- Shop & Item Group -->
    <div v-if="seckillProduct" class="shop-group">
      <div class="shop-name">
        <van-icon name="shop-o" /> 秒杀店铺
      </div>
      <div class="goods-item">
        <van-image :src="seckillProduct.image" width="60" height="60" radius="4" />
        <div class="goods-info">
          <div class="name">{{ seckillProduct.name }}</div>
          <div class="price-row">
            <span class="price">¥{{ seckillProduct.price }}</span>
            <div class="stepper-wrapper">
              <span>x 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <van-empty v-else description="获取秒杀商品信息失败" />

    <!-- Submit Bar -->
    <van-submit-bar
      v-if="seckillProduct"
      :price="totalPrice * 100"
      button-text="提交订单"
      :loading="loading"
      @submit="onSubmit"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { addressApi, orderApi, productApi } from '@/api';
import { showToast, showSuccessToast } from 'vant';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const shopIdParam = route.params.shopId;
const productIdParam = route.query.productId;
const activityIdParam = route.query.activityId;

const currentAddress = ref(null);
const loading = ref(false);
const seckillProduct = ref(null);

const totalPrice = computed(() => {
  return seckillProduct.value ? seckillProduct.value.price : 0;
});

const loadData = async () => {
  try {
    // 获取秒杀商品详情
    const seckillRes = await productApi.getSeckillActivity(shopIdParam);
    const data = seckillRes.data || seckillRes;
    if (data && Array.isArray(data)) {
      // 直接使用最宽松的匹配：只要 productId 或者 activityId 匹配上了这个对象的 id 或 activityId 就认为是它
      const target = data.find(item => {
        const matchProductId = String(item.id) === String(productIdParam) || String(item.id) === String(activityIdParam);
        const matchActivityId = item.activityId ? (String(item.activityId) === String(activityIdParam) || String(item.activityId) === String(productIdParam)) : false;
        return matchProductId || matchActivityId;
      });
      if (target) {
        seckillProduct.value = {
          id: target.id,
          activityId: target.activityId,
          name: target.name,
          image: target.imageUrl || '/images/product-default.svg',
          // 后端返回的价格字段是 price
          price: target.price
        };
      } else {
        console.warn('未在秒杀列表中找到对应商品', data, productIdParam, activityIdParam);
      }
    }
  } catch (error) {
    console.error('加载秒杀数据失败', error);
  }
};

const loadAddress = async () => {
  if (!userStore.userInfo?.userId) {
      try {
          await userStore.getUserInfoAction();
      } catch (e) {}
  }

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
  
  try {
      const data = await addressApi.list();
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

const onSubmit = async () => {
    if (!userStore.userInfo?.userId) {
        showToast('请先登录再下单');
        router.push('/login');
        return;
    }
    if (!currentAddress.value) {
        showToast('请选择收货地址');
        return;
    }

    loading.value = true;
    try {
        const req = {
            activityId: activityIdParam,
            shopId: shopIdParam,
            productId: productIdParam,
            addressId: currentAddress.value.id
        };
        const res = await orderApi.submitSeckill(req);
        const msg = (res && res.data) ? res.data : res; 
        
        showSuccessToast(typeof msg === 'string' ? msg : '抢购排队中');
        sessionStorage.removeItem('selected_address_id');
        
        setTimeout(() => {
            // 秒杀通常进入结果页或订单列表
            router.replace('/order/list');
        }, 1500);
    } catch (error) {
        console.error(error);
        showToast(error.msg || error.message || '抢购失败');
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    loadAddress();
    loadData();
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
                .stepper-wrapper {
                    display: flex;
                    align-items: center;
                    color: #999;
                }
            }
        }
    }
}
</style>
