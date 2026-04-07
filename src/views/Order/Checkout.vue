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

    <!-- Shop & Items Groups -->
    <div v-for="(group, sId) in groupedCartItems" :key="sId" class="shop-group">
      <div class="shop-name">
        <van-icon name="shop-o" /> {{ group.shopName }}
      </div>
      <div v-for="item in group.items" :key="item.id" class="goods-item">
        <van-image :src="item.image || item.productImage" width="60" height="60" radius="4" />
        <div class="goods-info">
          <div class="name">{{ item.productName || item.name }}</div>
          <div class="price-row">
            <span class="price">¥{{ item.price }}</span>
            <div class="stepper-wrapper">
              <van-stepper 
                v-model="item.quantity" 
                min="1" 
                max="99" 
                integer 
                @change="onChangeQuantity(item, sId)"
                class="stepper"
              />
              <van-icon name="delete-o" class="delete-icon" @click="onDelete(item)" />
            </div>
          </div>
        </div>
      </div>
      <!-- Shop Note -->
      <van-field
        v-model="shopNotes[sId]"
        rows="1"
        autosize
        label="备注"
        type="textarea"
        placeholder="请输入备注"
        class="shop-note"
      />
    </div>

    <!-- Submit Bar -->
    <van-submit-bar
      :price="totalPrice * 100"
      button-text="提交订单"
      :loading="loading"
      :disabled="!hasItems"
      @submit="onSubmit"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCartStore } from '@/store/modules/cart';
import { useUserStore } from '@/store/modules/user';
import { addressApi, orderApi } from '@/api';
import { showToast, showSuccessToast, showConfirmDialog, showDialog } from 'vant';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const userStore = useUserStore();

const shopIdParam = route.params.shopId;
const currentAddress = ref(null);
const loading = ref(false);
const shopNotes = reactive({});

// Computed: Group cart items by shopId
const groupedCartItems = computed(() => {
  const allItems = cartStore.items || [];
  const checkedItems = allItems.filter(item => item.checked);
  
  // If shopId param exists, filter by it
  const targetItems = shopIdParam 
    ? checkedItems.filter(item => String(item.shopId) === String(shopIdParam))
    : checkedItems;

  const groups = {};
  targetItems.forEach(item => {
    const sId = item.shopId;
    if (!groups[sId]) {
      groups[sId] = {
        shopName: item.shopName,
        items: []
      };
    }
    groups[sId].items.push(item);
  });
  return groups;
});

const hasItems = computed(() => Object.keys(groupedCartItems.value).length > 0);

const totalPrice = computed(() => {
  let total = 0;
  Object.values(groupedCartItems.value).forEach(group => {
    group.items.forEach(item => {
      total += item.price * item.quantity;
    });
  });
  return total;
});

const onChangeQuantity = (item, sId) => {
  cartStore.setQuantity(item.id, item.quantity);
};

const onDelete = (item) => {
  showConfirmDialog({
    title: '提示',
    message: '确定要移除该商品吗？',
  })
  .then(() => {
    cartStore.deleteItem(item.id);
  })
  .catch(() => {});
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

const getConfirmPayload = () => ({
    addressId: currentAddress.value.id,
    shopId: shopIdParam ? Number(shopIdParam) : null,
    shopNotes: shopNotes,
    payType: 1
});

const showConfirmDiffTips = async (items = []) => {
    const invalidItems = items.filter(item => item && item.valid === false);
    if (!invalidItems.length) {
        showToast('订单信息已变更，请重新确认');
        return;
    }
    const tips = invalidItems.slice(0, 6).map((item, index) => {
        const name = item.productName || `商品${item.productId || ''}`;
        const reason = item.reasonMsg || '信息有变更';
        if (item.reasonCode === 'PRICE_CHANGED') {
            return `${index + 1}. ${name} 价格变动：¥${item.cartPrice} -> ¥${item.currentPrice}`;
        }
        if (item.reasonCode === 'STOCK_NOT_ENOUGH') {
            return `${index + 1}. ${name} 库存不足：当前可买${item.availableStock}件`;
        }
        return `${index + 1}. ${name} ${reason}`;
    });
    if (invalidItems.length > 6) {
        tips.push(`... 另有${invalidItems.length - 6}件商品也发生变化`);
    }
    await showDialog({
        title: '订单信息已变更',
        message: tips.join('\n'),
        confirmButtonText: '我知道了'
    });
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
        const req = getConfirmPayload();
        const confirmRes = await orderApi.confirm(req);
        const confirmData = (confirmRes && confirmRes.data) ? confirmRes.data : confirmRes;
        if (!confirmData?.ready) {
            await showConfirmDiffTips(confirmData?.items || []);
            return;
        }
        if (!confirmData?.confirmToken) {
            showToast('订单确认失败，请稍后重试');
            return;
        }
        req.confirmToken = confirmData.confirmToken;
        const res = await orderApi.submit(req);
        // The backend now returns a string (parentOrderSn) or response object containing it
        const paySn = (res && res.data) ? res.data : res; 
        
        showSuccessToast('下单成功');
        sessionStorage.removeItem('selected_address_id');
        cartStore.fetchCartList();
        
        setTimeout(() => {
            router.replace(`/pay/0?sn=${paySn}`); // Use '0' as dummy ID, pass SN in query
        }, 1500);
    } catch (error) {
        console.error(error);
    } finally {
        loading.value = false;
    }
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
                .stepper-wrapper {
                    display: flex;
                    align-items: center;
                    .delete-icon {
                        margin-left: 10px;
                        font-size: 20px;
                        color: #999;
                    }
                }
            }
        }
    }

    .shop-note {
      padding: 0;
      margin-top: 10px;
      border-top: 1px dashed #eee;
      padding-top: 10px;
    }
}
</style>
