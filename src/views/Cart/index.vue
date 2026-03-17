<template>
  <div class="cart-page">
    <van-nav-bar 
      title="购物车" 
      fixed 
      placeholder 
      left-arrow
      @click-left="$router.go(-1)"
      :style="{ '--van-nav-bar-background': '#ff9000', '--van-nav-bar-title-text-color': '#fff', '--van-nav-bar-icon-color': '#fff' }"
    />

    <div v-if="!isLoggedIn" class="empty-state">
      <van-empty image="search" description="请先登录后查看购物车">
        <van-button 
          round 
          color="linear-gradient(to right, #ff9000, #ff5000)" 
          class="bottom-button" 
          @click="$router.push('/login')"
        >
          去登录
        </van-button>
      </van-empty>
    </div>

    <div v-else-if="cartItems.length === 0" class="empty-state">
      <van-empty image="cart" description="购物车空空如也">
        <van-button 
          round 
          color="linear-gradient(to right, #ff9000, #ff5000)" 
          class="bottom-button" 
          @click="$router.push('/')"
        >
          去逛逛
        </van-button>
      </van-empty>
    </div>

    <div v-else class="cart-list">
      <!-- 按店铺分组显示 -->
      <div v-for="(group, shopId) in groupedCartItems" :key="shopId" class="shop-group">
        <div class="shop-header">
          <van-checkbox v-model="group.checked" @click="toggleShopCheck(shopId, group.checked)">
            <span class="shop-name">{{ group.shopName }}</span>
          </van-checkbox>
        </div>
        
        <van-swipe-cell v-for="item in group.items" :key="item.productId" class="goods-item">
          <div class="goods-card">
            <van-checkbox v-model="item.checked" @click="handleCheckItem(item)" />
            <van-image :src="item.productImage" class="goods-img" fit="cover" />
            <div class="goods-info">
              <div class="goods-title">{{ item.productName }}</div>
              <div class="goods-sku" v-if="item.skuProps">{{ item.skuProps }}</div>
              <div class="goods-bottom">
                <div class="price">¥{{ item.price }}</div>
                <div class="action-box">
                  <van-stepper 
                    v-model="item.quantity" 
                    theme="round" 
                    button-size="22" 
                    disable-input 
                    @change="(val) => handleQuantityChange(val, item)"
                  />
                  <van-icon name="delete-o" class="delete-icon" @click.stop="handleDelete(item)" />
                </div>
              </div>
            </div>
          </div>
          <template #right>
            <van-button square text="删除" type="danger" class="delete-button" @click="handleDelete(item)" />
          </template>
        </van-swipe-cell>
      </div>
    </div>

    <van-submit-bar
      v-if="isLoggedIn && cartItems.length > 0"
      :price="totalPrice * 100"
      button-text="提交订单"
      @submit="onSubmit"
    >
      <van-checkbox v-model="allChecked" @click="toggleAllCheck">全选</van-checkbox>
    </van-submit-bar>

    <van-tabbar v-model="active" route fixed placeholder>
      <van-tabbar-item icon="home-o" to="/">首页</van-tabbar-item>
      <van-tabbar-item icon="apps-o" to="/category">分类</van-tabbar-item>
      <van-tabbar-item icon="shopping-cart-o" to="/cart">购物车</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/user">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { useUserStore } from '@/store/modules/user'
import { useCartStore } from '@/store/modules/cart'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()
const active = ref(2)

const isLoggedIn = computed(() => userStore.isLoggedIn)
const cartItems = computed(() => cartStore.items || [])

// 按店铺分组
const groupedCartItems = computed(() => {
  const groups = {}
  cartItems.value.forEach(item => {
    if (!groups[item.shopId]) {
      groups[item.shopId] = {
        shopName: item.shopName,
        items: [],
        checked: false // 店铺全选状态
      }
    }
    groups[item.shopId].items.push(item)
  })
  
  // 计算店铺是否全选
  Object.values(groups).forEach(group => {
    group.checked = group.items.every(item => item.checked)
  })
  
  return groups
})

// 总价
const totalPrice = computed(() => {
  return cartItems.value
    .filter(item => item.checked)
    .reduce((total, item) => total + item.price * item.quantity, 0)
})

// 全选状态
const allChecked = computed({
  get: () => cartItems.value.length > 0 && cartItems.value.every(item => item.checked),
  set: (val) => {
    // 逻辑在 toggleAllCheck 中处理
  }
})

// 初始化
onMounted(async () => {
  if (isLoggedIn.value) {
    await cartStore.fetchCartList()
  }
})

// 监听登录状态变化
watch(isLoggedIn, async (newVal) => {
  if (newVal) {
    await cartStore.fetchCartList()
  }
})

// 修改数量
const handleQuantityChange = async (value, item) => {
  try {
    await cartStore.updateQuantity(item.productId, value)
  } catch (error) {
    showToast('修改数量失败')
  }
}

// 勾选商品
const handleCheckItem = async (item) => {
  try {
    await cartStore.checkCartItem({
      productIds: [item.productId],
      checked: item.checked ? 1 : 0
    })
  } catch (error) {
    showToast('操作失败')
  }
}

// 店铺全选
const toggleShopCheck = async (shopId, checked) => {
  const group = groupedCartItems.value[shopId]
  if (!group) return
  
  const productIds = group.items.map(item => item.productId)
  try {
    await cartStore.checkCartItem({
      productIds,
      checked: checked ? 1 : 0
    })
    // 本地乐观更新，等待接口刷新
    await cartStore.fetchCartList()
  } catch (error) {
    showToast('操作失败')
  }
}

// 购物车全选
const toggleAllCheck = async () => {
  const targetChecked = !allChecked.value
  const productIds = cartItems.value.map(item => item.productId)
  try {
    await cartStore.checkCartItem({
      productIds,
      checked: targetChecked ? 1 : 0
    })
    await cartStore.fetchCartList()
  } catch (error) {
    showToast('操作失败')
  }
}

// 删除商品
const handleDelete = (item) => {
  showConfirmDialog({
    title: '提示',
    message: '确定要删除这个商品吗？',
  }).then(async () => {
    try {
      await cartStore.deleteCartItem(item.productId)
      showToast('已删除')
      await cartStore.fetchCartList()
    } catch (error) {
      showToast('删除失败')
    }
  })
}

// 提交订单
const onSubmit = () => {
  const checkedItems = cartItems.value.filter(item => item.checked)
  if (checkedItems.length === 0) {
    showToast('请选择要结算的商品')
    return
  }
  
  // 检查是否跨店铺结算（假设一次只能结算一个店铺）
  const shopIds = new Set(checkedItems.map(item => item.shopId))
  if (shopIds.size > 1) {
    showToast('暂不支持跨店铺结算，请分批下单')
    return
  }
  
  const shopId = [...shopIds][0]
  router.push(`/checkout/${shopId}`)
}
</script>

<style lang="scss" scoped>
.cart-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 100px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
  
  .bottom-button {
    width: 160px;
    height: 40px;
    margin-top: 20px;
  }
}

.cart-list {
  padding: 12px;
}

.shop-group {
  background: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
  
  .shop-header {
    padding: 12px 16px;
    border-bottom: 1px solid #f5f5f5;
    
    .shop-name {
      font-weight: bold;
      margin-left: 8px;
    }
  }
}

.goods-item {
  .goods-card {
    display: flex;
    padding: 16px;
    background: #fff;
    
    .goods-img {
      width: 88px;
      height: 88px;
      border-radius: 4px;
      margin: 0 10px;
      background: #f5f5f5;
    }
    
    .goods-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      
      .goods-title {
        font-size: 14px;
        line-height: 20px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .goods-sku {
        font-size: 12px;
        color: #999;
        margin-top: 4px;
        background: #f7f8fa;
        padding: 2px 4px;
        border-radius: 2px;
        width: fit-content;
      }
      
      .goods-bottom {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-top: 8px;
        
        .price {
          color: #ff4d4f;
          font-size: 16px;
          font-weight: bold;
        }

        .action-box {
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
  
  .delete-button {
    height: 100%;
  }
}
</style>
