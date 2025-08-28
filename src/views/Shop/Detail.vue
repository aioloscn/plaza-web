<template>
  <div class="shop-detail-page">
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
            <van-button
              type="warning"
              size="small"
              round
              @click="addToCart(product)"
            >
              加入购物车
            </van-button>
          </div>
        </div>
      </van-list>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'

const route = useRoute()
const shopId = route.params.id

const loading = ref(false)
const finished = ref(false)
const shopInfo = ref({})
const productList = ref([])

// 获取商家信息
const getShopInfo = async () => {
  // 模拟获取商家信息
  shopInfo.value = {
    id: shopId,
    name: `商家${shopId}`,
    description: '这是一家很棒的店铺，提供优质的服务和美味的食物',
    image: '/images/shop-default.svg',
    banner: '/src/assets/images/shop-banner.jpg',
    rating: 4.5,
    distance: (Math.random() * 5).toFixed(1),
    address: '北京市朝阳区某某街道123号'
  }
}

// 加载商品列表
const onLoad = () => {
  loading.value = true
  
  setTimeout(() => {
    const newProducts = Array.from({ length: 10 }, (_, i) => ({
      id: productList.value.length + i + 1,
      name: `商品${productList.value.length + i + 1}`,
      description: '新鲜美味，值得品尝',
      image: '/images/product-default.svg',
      price: Math.floor(Math.random() * 100) + 20,
      originalPrice: Math.random() > 0.5 ? Math.floor(Math.random() * 50) + 100 : null
    }))
    
    productList.value.push(...newProducts)
    loading.value = false
    
    if (productList.value.length >= 30) {
      finished.value = true
    }
  }, 1000)
}

// 加入购物车
const addToCart = (product) => {
  showToast(`已将 ${product.name} 加入购物车`)
}

// 处理店铺图片加载错误
const handleImageError = (event) => {
  event.target.src = '/images/shop-default.svg'
}

// 处理商品图片加载错误
const handleProductImageError = (event) => {
  event.target.src = '/images/product-default.svg'
}

onMounted(() => {
  getShopInfo()
  onLoad()
})
</script>

<style lang="scss" scoped>
.shop-detail-page {
  min-height: 100vh;
  background-color: $background-color;
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
</style>