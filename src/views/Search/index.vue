<template>
  <div class="search-page">
    <!-- 搜索头部 -->
    <div class="search-header">
      <van-search
        v-model="searchValue"
        placeholder="搜索商家、美食"
        background="#FF8400"
        @search="onSearch"
        @cancel="$router.go(-1)"
        show-action
        autofocus
      />
    </div>

    <!-- 搜索历史 -->
    <div v-if="!searchValue && searchHistory.length" class="search-history">
      <div class="history-header">
        <span>搜索历史</span>
        <van-icon name="delete" @click="clearHistory" />
      </div>
      <div class="history-tags">
        <van-tag
          v-for="(item, index) in searchHistory"
          :key="index"
          type="default"
          @click="searchValue = item"
        >
          {{ item }}
        </van-tag>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div v-if="searchValue" class="search-results">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div
          v-for="(shop, index) in searchResults"
          :key="index"
          class="shop-item"
          @click="$router.push(`/shop/${shop.id}`)"
        >
          <div class="shop-image">
            <img :src="shop.image || '/images/shop-default.svg'" :alt="shop.name" @error="handleImageError" />
          </div>
          <div class="shop-info">
            <h3 class="shop-name">{{ shop.name }}</h3>
            <p class="shop-desc">{{ shop.description }}</p>
            <div class="shop-meta">
              <span class="price">¥{{ shop.price }}</span>
              <span class="distance">{{ shop.distance }}km</span>
            </div>
          </div>
        </div>
      </van-list>
    </div>

    <!-- 空状态 -->
    <div v-if="searchValue && !loading && searchResults.length === 0" class="empty-state">
      <van-empty description="暂无搜索结果" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/store/modules/app'
import { showToast } from 'vant'

const router = useRouter()
const appStore = useAppStore()

const searchValue = ref('')
const loading = ref(false)
const finished = ref(false)
const searchResults = ref([])

const searchHistory = computed(() => appStore.searchHistory)

// 搜索
const onSearch = () => {
  if (!searchValue.value.trim()) {
    showToast('请输入搜索关键词')
    return
  }
  
  appStore.addSearchHistory(searchValue.value)
  searchResults.value = []
  finished.value = false
  onLoad()
}

// 加载搜索结果
const onLoad = () => {
  loading.value = true
  
  setTimeout(() => {
    // 模拟搜索结果
    const newResults = Array.from({ length: 10 }, (_, i) => ({
      id: searchResults.value.length + i + 1,
      name: `${searchValue.value}相关商家${searchResults.value.length + i + 1}`,
      description: '这是一家很棒的店铺',
      image: '/images/shop-default.svg',
      price: Math.floor(Math.random() * 100) + 20,
      distance: (Math.random() * 5).toFixed(1)
    }))
    
    searchResults.value.push(...newResults)
    loading.value = false
    
    if (searchResults.value.length >= 30) {
      finished.value = true
    }
  }, 1000)
}

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.src = '/images/shop-default.svg'
}

// 清空搜索历史
const clearHistory = () => {
  appStore.clearSearchHistory()
}
</script>

<style lang="scss" scoped>
.search-page {
  min-height: 100vh;
  background-color: $background-color;
}

.search-header {
  background-color: $primary-color;
}

.search-history {
  padding: 15px;
  background-color: #fff;
  margin-bottom: 10px;
  
  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    font-size: 14px;
    color: $text-color-2;
  }
  
  .history-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.search-results {
  background-color: #fff;
}

.shop-item {
  display: flex;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  
  .shop-image {
    width: 80px;
    height: 60px;
    margin-right: 15px;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 4px;
    }
  }
  
  .shop-info {
    flex: 1;
    
    .shop-name {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 5px;
      color: $text-color;
    }
    
    .shop-desc {
      font-size: 14px;
      color: $text-color-2;
      margin-bottom: 8px;
    }
    
    .shop-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .price {
        color: $primary-color;
        font-size: 16px;
        font-weight: bold;
      }
      
      .distance {
        color: $text-color-3;
        font-size: 12px;
      }
    }
  }
}

.empty-state {
  padding: 60px 20px;
}
</style>