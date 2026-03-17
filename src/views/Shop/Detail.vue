<template>
  <div class="shop-detail-page" :class="{ ignore: isDesktop }">
    <!-- 头部导航 -->
    <van-nav-bar
      :title="shopInfo.name || '商家详情'"
      left-arrow
      @click-left="$router.go(-1)"
      :style="{ backgroundColor: '#FF8400', color: '#fff' }"
    />

    <!-- 商家信息 -->
    <div class="shop-info">
      <div class="shop-banner">
        <img :src="shopInfo.banner || shopInfo.image || '/images/shop-default.svg'" :alt="shopInfo.name" @error="handleImageError" />
      </div>
      
      <div class="shop-basic">
        <h2 class="shop-name">{{ shopInfo.name }}</h2>
        <p class="shop-desc">{{ shopInfo.description }}</p>
        <div class="shop-meta">
          <span class="rating">
            <van-rate v-model="shopInfo.rating" readonly size="14" />
            <span class="rating-text">{{ shopInfo.rating }}</span>
          </span>
          <span class="distance">{{ shopInfo.distance }}km</span>
        </div>
        <div class="shop-address">
          <van-icon name="location-o" />
          <span>{{ shopInfo.address }}</span>
        </div>
      </div>
    </div>

    <!-- 商品列表 -->
    <div class="product-list">
      <div class="section-title">推荐商品</div>
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div
          v-for="(product, index) in productList"
          :key="index"
          class="product-item"
        >
          <div class="product-image">
            <img :src="product.image || '/images/product-default.svg'" :alt="product.name" @error="handleProductImageError" />
          </div>
          <div class="product-info">
            <h3 class="product-name">{{ product.name }}</h3>
            <p class="product-desc">{{ product.description }}</p>
            <div class="product-price">
              <span class="current-price">¥{{ product.price }}</span>
              <span v-if="product.originalPrice" class="original-price">¥{{ product.originalPrice }}</span>
            </div>
          </div>
          <div class="product-action">
            <van-stepper
              :model-value="getProductCartQuantity(product.id)"
              min="0"
              theme="round"
              button-size="22"
              disable-input
              @plus="addToCart(product)"
              @minus="minusFromCart(product)"
            />
          </div>
        </div>
      </van-list>
    </div>

    <!-- 底部结算栏 -->
    <van-submit-bar
      :price="Number(cartStore.getShopCartTotal(shopId)) * 100"
      button-text="下单"
      @submit="onSubmitOrder"
      :disabled="!cartStore.getShopCartCount(shopId)"
    >
      <div class="cart-icon-wrapper">
        <van-badge :content="cartStore.getShopCartCount(shopId) || ''" max="99">
          <van-icon name="shopping-cart-o" size="24" />
        </van-badge>
        <span style="margin-left: 8px; font-size: 14px;">合计:</span>
      </div>
    </van-submit-bar>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { shopApi, productApi } from '@/api'
import { useCartStore } from '@/store/modules/cart'
import { useUserStore } from '@/store/modules/user'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()
const shopId = route.params.id

// 获取商品在购物车中的数量
const getProductCartQuantity = (productId) => {
  // 注意：购物车里的商品可能有 shopId 区分
  // 这里简化查找，需确保 cartStore.items 结构
  // cart.js 中存储的是 productId，而不是 id
  const item = cartStore.items.find(item => String(item.productId) === String(productId) && String(item.shopId) === String(shopId))
  return item ? item.quantity : 0
}

// Desktop 侦测（>=1200 视为 PC）
const isDesktop = ref(false)
const updateIsDesktop = () => {
  isDesktop.value = typeof window !== 'undefined' && window.innerWidth >= 1200
}

const loading = ref(false)
const finished = ref(false)
const shopInfo = ref({})
const productList = ref([])

// 获取商家信息
const getShopInfo = async () => {
  try {
    const response = await shopApi.getShopDetail(shopId)
    // 根据 request.js 最新的逻辑，如果是成功，会直接返回数据对象或者 data 包装
    const data = response.data || response
    if (data) {
      shopInfo.value = {
        ...data,
        image: data.iconUrl || '/images/shop-default.svg',
        banner: data.iconUrl || '/src/assets/images/shop-banner.jpg',
        rating: data.score || 5.0,
        distance: data.distance || '',
        address: data.address || ''
      }
    }
  } catch (error) {
    console.error('获取商家信息失败', error)
    showToast('获取商家信息失败')
  }
}

// 加载商品列表
const onLoad = async () => {
  loading.value = true
  
  try {
    const response = await productApi.getProductList(shopId)
    const data = response.data || response
    if (data && Array.isArray(data)) {
      const newProducts = data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        image: item.imageUrl || '/images/product-default.svg',
        price: item.price,
        originalPrice: null
      }))
      
      productList.value = newProducts
    }
    // 因为后端是一次性返回所有商品，所以直接标记加载完成
    finished.value = true
  } catch (error) {
    console.error('获取商品列表失败', error)
    // 即使失败也要停止加载状态，避免无限 loading
    finished.value = true
  } finally {
    loading.value = false
  }
}

// 加入购物车
const addToCart = (product) => {
  const shopData = { ...shopInfo.value, id: shopInfo.value.id || shopId }
  cartStore.addToCart(product, shopData)
}

// 减少购物车商品
const minusFromCart = (product) => {
  cartStore.minusQuantity(product.id, shopInfo.value.id || shopId)
}

// 点击下单
const onSubmitOrder = async () => {
  // 1. 先同步一下 token（防止刚登录跳回来，Pinia没更新）
  // const currentToken = cartStore.getTempId() // 临时防抖
  let tokenExists = userStore.isLoggedIn;
  
  // 2. 如果没登录，强行拉取一次（可能 cookie 已经种上了，但用户信息还没拉）
  if (!tokenExists) {
      try {
          // 不传参，由 store 内部处理 userId
          await userStore.getUserInfoAction();
          // 拉取完再判断一次
          tokenExists = userStore.isLoggedIn;
          console.log('下单前强制拉取用户信息结果:', tokenExists);
          
          // 如果这里拉取成功了，说明是刚登录，顺便合并一下购物车
          if (tokenExists) {
             await cartStore.mergeCartAfterLogin();
          }
      } catch (e) {
          console.error('下单校验未登录, 详细错误:', e);
      }
  }

  // 3. 判定
  if (tokenExists) {
    // 强制跳转，不等待
    router.push(`/checkout/${shopId}`)
    return
  }

  // 4. 跳转
  showToast('请先登录，正在跳转...')
  setTimeout(() => {
    // badger-web 登录页逻辑，模仿 live-web 的做法，携带 redirect
    window.location.href = `http://www.aiolos.com:5502/index.html?redirect=${encodeURIComponent(window.location.href)}`
  }, 1000)
}

// 处理店铺图片加载错误
const handleImageError = (event) => {
  event.target.src = '/images/shop-default.svg'
}

// 处理商品图片加载错误
const handleProductImageError = (event) => {
  event.target.src = '/images/product-default.svg'
}

onMounted(async () => {
  updateIsDesktop()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateIsDesktop)
  }
  
  // 检查是否从 badger-web 登录回跳
  // 如果当前尚未判定登录，尝试触发一下 getUserInfo
  if (!userStore.isLoggedIn) {
      try {
          await userStore.getUserInfoAction();
          // 如果获取成功，说明登录了，触发一下合并购物车
          await cartStore.mergeCartAfterLogin();
      } catch (e) {
          // 未登录
          console.log('未检测到登录状态', e);
      }
  } else {
      // 即使已经判定为登录，也可以尝试合并一下，防止刷新页面时丢失合并时机
      await cartStore.mergeCartAfterLogin();
  }

  getShopInfo()
  onLoad()
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateIsDesktop)
  }
})
</script>

<style lang="scss" scoped>
.shop-detail-page {
  min-height: 100vh;
  background-color: $background-color;
  padding-bottom: 50px; /* 为底部 submit-bar 留出空间 */
  overflow-y: auto; /* 确保自身可滚动 */
  -webkit-overflow-scrolling: touch; /* 优化 iOS 滚动体验 */
}

.shop-info {
  background-color: #fff;
  margin-bottom: 10px;
  
  .shop-banner {
    height: 200px;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  .shop-basic {
    padding: 15px;
    
    .shop-name {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 8px;
      color: $text-color;
    }
    
    .shop-desc {
      font-size: 14px;
      color: $text-color-2;
      margin-bottom: 10px;
      line-height: 1.4;
    }
    
    .shop-meta {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      
      .rating {
        display: flex;
        align-items: center;
        margin-right: 15px;
        
        .rating-text {
          margin-left: 5px;
          font-size: 14px;
          color: $text-color-2;
        }
      }
      
      .distance {
        font-size: 14px;
        color: $text-color-3;
      }
    }
    
    .shop-address {
      display: flex;
      align-items: center;
      font-size: 14px;
      color: $text-color-2;
      
      .van-icon {
        margin-right: 5px;
      }
    }
  }
}

.product-list {
  background-color: #fff;
  
  .section-title {
    padding: 15px;
    font-size: 16px;
    font-weight: bold;
    border-bottom: 1px solid #f0f0f0;
  }
}

.product-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  
  .product-image {
    width: 80px;
    height: 80px;
    margin-right: 15px;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 4px;
    }
  }
  
  .product-info {
    flex: 1;
    
    .product-name {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 5px;
      color: $text-color;
    }
    
    .product-desc {
      font-size: 14px;
      color: $text-color-2;
      margin-bottom: 8px;
    }
    
    .product-price {
      .current-price {
        color: $primary-color;
        font-size: 16px;
        font-weight: bold;
      }
      
      .original-price {
        margin-left: 8px;
        color: $text-color-3;
        font-size: 14px;
        text-decoration: line-through;
      }
    }
  }
  
  .product-action {
    .van-button {
      background-color: $primary-color;
      border-color: $primary-color;
    }
  }
}

/* 桌面端样式（忽略 px-to-viewport 转换） */
.ignore {
  .shop-detail-page { width: min(1120px, 72vw); margin: 0 auto; box-sizing: border-box; }
  .shop-info { width: min(1120px, 72vw); margin: 12px auto; display: block; gap: 0; }
  .product-list { width: min(1120px, 72vw); margin: 12px auto 20px; padding: 0; background: transparent; }

  /* 更紧凑的标题与列表卡片 */
  .section-title { 
    padding: 6px 0 10px; 
    font-size: 16px;
    background: transparent;
    border: none;
  }
  
  :deep(.van-list) { 
    gap: 16px; 
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
  
  .product-item { 
    padding: 12px; 
    border-radius: 10px; 
    border: 1px solid #eee;
    display: block; /* 卡片式布局 */
    background: #fff;
    transition: box-shadow 0.2s ease, transform 0.2s ease;
    
    &:hover {
      box-shadow: 0 6px 16px rgba(0,0,0,0.08);
      transform: translateY(-2px);
    }

    .product-image { 
      height: 160px; 
      width: 100%;
      margin-right: 0;
      margin-bottom: 10px;
      
      img { border-radius: 6px; }
    }
    
    .product-action {
      margin-top: 8px;
      text-align: right;
    }
  }
}
</style>