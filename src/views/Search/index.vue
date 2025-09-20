<template>
  <div class="search-page" :class="{ ignore: isDesktop }">
    <!-- 搜索头部 -->
    <div class="search-header">
      <van-search
        ref="searchRef"
        v-model="searchValue"
        placeholder="搜索商家、美食"
        background="#FF8400"
        @search="handleSearchSubmit"
        @cancel="handleCancel"
        @click="handleSearchClick"
        @clear="handleClear"
        show-action
        clearable
      />
    </div>

    <!-- 类目选择 -->
    <div class="category-section">
      <van-grid :column-num="4" :border="false">
        <van-grid-item
          v-for="(item, index) in gridItems"
          :key="index"
          :text="item.text"
          @click="handleCategoryClick(item)"
          :class="{ 'active': selectedCategoryId === item.id }"
        >
          <template #icon>
            <van-icon 
              v-if="item.hasError"
              :name="item.fallbackIcon"
              size="24"
              class="category-icon-fallback"
            />
            <img 
              v-else
              :src="item.icon" 
              :alt="item.text"
              class="category-icon"
              @error="handleImageError($event, item)"
            />
          </template>
        </van-grid-item>
      </van-grid>
    </div>

    <!-- 排序选择 -->
    <div class="sort-section">
      <div class="sort-options">
        <div
          class="sort-option"
          :class="{ active: activeSort === '0' }"
          @click="handleSortChange('0')"
        >
          <van-icon name="filter-o" size="14" />
          <span>综合排序</span>
        </div>
        <div
          class="sort-option"
          :class="{ active: activeSort === '1' }"
          @click="handleSortChange('1')"
        >
          <van-icon name="location-o" size="14" />
          <span>距离优先</span>
        </div>
      </div>
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
          @click="handleHistoryClick(item)"
        >
          {{ item }}
        </van-tag>
      </div>
    </div>

    <!-- 标签统计区域 -->
    <div v-if="tagStats.length > 0" class="tags-section">
      <div class="tags-title">热门标签</div>
      <div class="tags-container">
        <div
          v-for="tag in tagStats"
          :key="tag.name"
          class="tag-button"
          :class="{ 'selected': selectedTag === tag.name }"
          @click="handleTagClick(tag.name)"
        >
          <span class="tag-name">{{ tag.name }}</span>
          <span class="tag-count">{{ tag.count }}</span>
        </div>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div v-if="searchValue || selectedCategoryId" class="search-results">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          :immediate-check="false"
          @load="onLoad"
        >
        <div
          v-for="(shop, index) in searchResults"
          :key="index"
          class="shop-item"
          @click="$router.push(`/shop/${shop.id}`)"
        >
          <div class="shop-image">
            <img :src="shop.iconUrl || shop.image || '/images/shop-default.svg'" :alt="shop.name" @error="handleImageError($event, shop)" />
          </div>
          <div class="shop-info">
            <div class="shop-name">{{ shop.name }}</div>
            <div class="shop-rating" v-if="shop.score !== undefined">
              <van-rate v-model="shop.score" :readonly="true" :size="14" color="#ffd21e" void-color="#eee" />
              <span class="score-text">({{ shop.score }})</span>
            </div>
            <div class="shop-price">
              <span class="price-text">人均¥{{ shop.perCapitaPrice || shop.price }}</span>
              <span v-if="shop.distanceText" class="distance">{{ shop.distanceText }}</span>
            </div>
            <div class="shop-tags" v-if="shop.tags">{{ shop.tags }}</div>
          </div>
        </div>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 空状态 -->
    <div v-if="(searchValue || selectedCategoryId) && !loading && searchResults.length === 0" class="empty-state">
      <van-empty description="暂无搜索结果" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/store/modules/app'
import { shopApi } from '@/api/modules/shop'
import { searchCategory } from '@/api'
import { GeolocationService } from '@/utils/geolocation'
import { getLocationCache, setLocationCache } from '@/utils/storage'
import { showToast } from 'vant'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

const searchValue = ref('')
const searchRef = ref(null)
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const searchResults = ref([])
const currentPage = ref(1)
const pageSize = 10
const userLocation = ref({
  longitude: 116.404,  // 默认北京经度
  latitude: 39.915     // 默认北京纬度
})
const locationReady = ref(false) // 位置获取完成标识

// 标签统计相关数据
const tagStats = ref([])
const selectedTag = ref('') // 当前选中的标签

// Desktop 侦测（>=1200px 视为 PC），用于切换到 PC-only 样式命名空间（ignore）
const isDesktop = ref(false)
const updateIsDesktop = () => {
  isDesktop.value = typeof window !== 'undefined' && window.innerWidth >= 1200
}

// 类目相关数据
const categories = ref([])
const gridItems = ref([
  { icon: 'shop-o', text: '美食', type: 'food', id: 1 },
  { icon: 'hotel-o', text: '酒店', type: 'hotel', id: 2 },
  { icon: 'gift-o', text: '团购', type: 'group', id: 3 },
  { icon: 'star-o', text: '娱乐', type: 'entertainment', id: 4 }
])
const selectedCategoryId = ref(null)

// 排序相关数据
const activeSort = ref('0') // 默认综合排序

const searchHistory = computed(() => appStore.searchHistory)



// 处理标签点击
const handleTagClick = (tagName) => {
  // 如果点击的是已选中的标签，则取消选中
  if (selectedTag.value === tagName) {
    selectedTag.value = ''
  } else {
    // 否则选中该标签
    selectedTag.value = tagName
  }
  
  // 重新搜索
  searchResults.value = []
  currentPage.value = 1
  finished.value = false
  onLoad()
}

// 获取用户位置
const getUserLocation = async () => {
  try {
    // 检查缓存
    const cachedLocation = getLocationCache()
    if (cachedLocation) {
      userLocation.value = cachedLocation
      locationReady.value = true
      return
    }
    
    // 获取新位置
    const location = await GeolocationService.getCurrentPosition()
    userLocation.value = location
    
    // 缓存位置信息
    setLocationCache(location)
  } catch (error) {
    console.error('获取位置失败:', error)
    // 使用默认位置（北京）
    userLocation.value = { longitude: 116.404, latitude: 39.915 }
  } finally {
    locationReady.value = true
  }
}

// 聚焦搜索框的函数
const focusSearchInput = () => {
  // 多种方法尝试聚焦
  const tryFocus = () => {
    // 方法1：使用ref
    if (searchRef.value && searchRef.value.focus) {
      try {
        searchRef.value.focus()
        return true
      } catch (e) {
        // 聚焦失败，尝试其他方法
      }
    }
    
    // 方法2：查找input元素
    const inputElement = document.querySelector('.van-search__field') || 
                        document.querySelector('input[type="search"]') ||
                        document.querySelector('.search-page input')
    
    if (inputElement) {
      try {
        input.focus()
        return true
      } catch (e) {
        // 聚焦失败
      }
    }
    return false
  }
  
  // 立即尝试
  nextTick(() => {
    if (!tryFocus()) {
      // 如果失败，延迟重试
      setTimeout(() => {
        tryFocus()
      }, 200)
    }
  })
}

// 处理搜索框点击事件
const handleSearchClick = () => {
  focusSearchInput()
}

// 预加载图片
const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    let timeoutId = null
    let isResolved = false
    
    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      img.onload = null
      img.onerror = null
    }
    
    img.onload = () => {
      if (!isResolved) {
        isResolved = true
        cleanup()
        resolve(src)
      }
    }
    
    img.onerror = () => {
      if (!isResolved) {
        isResolved = true
        cleanup()
        reject(new Error(`Failed to load image: ${src}`))
      }
    }
    
    img.src = src
    
    // 设置超时
    timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true
        cleanup()
        reject(new Error('Image load timeout'))
      }
    }, 5000)
  })
}

// 获取分类数据
const fetchCategories = async () => {
  try {
    const response = await searchCategory()
    
    const data = response.data || response
    categories.value = data
    
    // 将分类数据映射到网格组件
    if (data && Array.isArray(data) && data.length > 0) {
      const mappedData = await Promise.all(data.map(async (category, index) => {
        const item = {
          icon: category.iconUrl || '/images/default-category.png',
          fallbackIcon: 'shop-o',
          text: category.name || category.title || `分类${index + 1}`,
          type: category.type || category.id || `type_${index}`,
          id: category.id || index,
          hasError: false
        }
        
        // 预加载图片，如果失败则标记为错误
        if (category.iconUrl) {
          try {
            await preloadImage(category.iconUrl)
          } catch (error) {
            item.hasError = true
          }
        }
        
        return item
      }))
      gridItems.value = mappedData
    }
  } catch (error) {
    // 获取分类失败，保持默认数据
  }
}

// 处理类目点击
const handleCategoryClick = (item) => {
  selectedCategoryId.value = selectedCategoryId.value === item.id ? null : item.id
  
  // 如果有搜索关键词或选中了类目，触发搜索
  if (searchValue.value.trim() || selectedCategoryId.value) {
    onSearch()
  }
}

// 处理排序切换
const handleSortChange = (name) => {
  const oldSort = activeSort.value
  activeSort.value = name
  
  // 只有当排序真正发生变化时才触发搜索
  if (oldSort !== name && (searchValue.value.trim() || selectedCategoryId.value)) {
    onSearch()
  }
}

// 处理图片加载错误
const handleImageError = (event, item) => {
  // 标记该项目有错误，触发重新渲染使用备用图标
  const itemIndex = gridItems.value.findIndex(gridItem => gridItem.id === item.id)
  if (itemIndex !== -1) {
    gridItems.value[itemIndex].hasError = true
  }
}

// 组件挂载时获取位置并聚焦搜索框
onMounted(async () => {
  // 侦测端类型并监听窗口变化
  updateIsDesktop()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateIsDesktop)
  }

  await fetchCategories()
  
  // 检查是否有来自首页的类目参数
  if (route.query.categoryId) {
    selectedCategoryId.value = parseInt(route.query.categoryId)
  }
  
  // 获取位置（异步）
  await getUserLocation()
  
  // 位置获取完成后，如果有类目参数则触发搜索
  if (route.query.categoryId && locationReady.value) {
    searchResults.value = []
    currentPage.value = 1
    finished.value = false
    onLoad()
  }
  
  focusSearchInput()
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateIsDesktop)
  }
})

// 页面激活时聚焦搜索框（处理从其他页面返回的情况）
onActivated(() => {
  focusSearchInput()
})

// 处理搜索提交（用户按回车或点击搜索按钮）
const handleSearchSubmit = () => {
  if (searchValue.value.trim()) {
    onSearch()
  }
}

// 处理搜索历史点击
const handleHistoryClick = (keyword) => {
  searchValue.value = keyword
  onSearch()
}

// 处理取消按钮
const handleCancel = () => {
  // 检查是否有历史记录可以返回
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    // 如果没有历史记录，返回首页
    router.push('/')
  }
}

// 处理清除搜索框
const handleClear = () => {
  searchValue.value = ''
  selectedCategoryId.value = null
  selectedTag.value = ''
  searchResults.value = []
  finished.value = false
  currentPage.value = 1
}

// 搜索
const onSearch = async () => {
  // 检查是否有搜索条件（关键词或类目）
  if (!searchValue.value.trim() && !selectedCategoryId.value) {
    showToast('请输入搜索关键词或选择类目')
    return
  }
  
  // 只有关键词搜索才添加到历史记录
  if (searchValue.value.trim()) {
    appStore.addSearchHistory(searchValue.value)
  }
  
  // 重置选中的标签
  selectedTag.value = ''
  
  searchResults.value = []
  currentPage.value = 1
  finished.value = false
  onLoad()
}

// 加载搜索结果
const onLoad = async () => {
  // 检查是否有搜索条件
  if (!searchValue.value.trim() && !selectedCategoryId.value) {
    loading.value = false
    return
  }
  
  // 等待位置获取完成
  if (!locationReady.value) {
    loading.value = false
    return
  }
  
  loading.value = true
  
  try {
    const searchParams = {
      keyword: searchValue.value || '',
      longitude: userLocation.value.longitude,
      latitude: userLocation.value.latitude,
      page: currentPage.value,
      pageSize: 10
    }
    
    // 添加可选参数
    if (selectedCategoryId.value) {
      searchParams.categoryId = selectedCategoryId.value
    }
    
    if (activeSort.value) {
      searchParams.orderBy = parseInt(activeSort.value)
    }
    
    if (selectedTag.value) {
      searchParams.tag = selectedTag.value
    }
    
    const response = await shopApi.searchShops(searchParams)
     
     if (response.data && response.data.records) {
      // 格式化数据以匹配前端显示需求
      const formattedResults = response.data.records.map(shop => ({
        ...shop,
        id: shop.id,
        name: shop.name || shop.shopName || shop.title || '未知店铺',
        score: shop.score || shop.rating || shop.star || 0,
        perCapitaPrice: shop.perCapitaPrice || shop.avgPrice || shop.price || 0,
        tags: shop.tags || shop.category || shop.type || '',
        iconUrl: shop.iconUrl || shop.image || shop.avatar || '/images/shop-default.svg',
        distanceText: shop.distance || shop.distanceText || '',
        // 保持向后兼容
        description: shop.description || shop.desc || '暂无描述',
        image: shop.image || shop.avatar || shop.logo || '/images/shop-default.svg',
        price: shop.price || shop.avgPrice || 0,
        distance: shop.distance !== undefined && shop.distance !== null ? (shop.distance / 1000).toFixed(1) : '0.0'
      }))
      
      if (currentPage.value === 1) {
        searchResults.value = formattedResults
        
        // 使用后端返回的标签聚合数据（从第一条记录中获取）
        if (response.data.records && response.data.records.length > 0) {
          const firstRecord = response.data.records[0]
          console.log('第一条记录:', firstRecord)
          console.log('tagAggregations:', firstRecord.tagAggregations)
          
          if (firstRecord.tagAggregations && Array.isArray(firstRecord.tagAggregations)) {
            tagStats.value = firstRecord.tagAggregations.map(item => ({
              name: item.tag,
              count: item.count
            }))
            console.log('处理后的tagStats:', tagStats.value)
          } else {
            console.log('第一条记录中没有找到tagAggregations数据')
          }
        }
      } else {
        searchResults.value.push(...formattedResults)
      }
      
      // 判断是否还有更多数据
      const { current, size, total } = response.data
      if (formattedResults.length < pageSize || current * size >= total) {
        finished.value = true
      } else {
        currentPage.value++
      }
    } else {
      finished.value = true
    }
  } catch (error) {
    showToast('搜索失败，请重试')
    finished.value = true
  } finally {
    loading.value = false
  }
}

// 下拉刷新
const onRefresh = async () => {
  // 重置分页状态，但保留标签统计和选中状态
  currentPage.value = 1
  finished.value = false
  searchResults.value = []
  
  // 执行搜索
  await onLoad()
  
  // 结束刷新状态
  refreshing.value = false
}

// 清空搜索历史
const clearHistory = () => {
  appStore.clearSearchHistory()
}
</script>

<style lang="scss" scoped>
.search-page {
  height: 100vh;
  display: flex;
  flex-direction: column; /* 修复横向排列导致的布局错乱 */
  overflow: hidden;
}

.search-header {
  background-color: $primary-color;
  padding: 10px;
  
  :deep(.van-search) {
    background-color: transparent;
    
    .van-search__content {
      background-color: rgba(255, 255, 255, 0.9);
      border-radius: 20px;
    }
  }
}

.category-section {
  background-color: white;
  padding: 15px;
  margin-bottom: 10px;
  
  :deep(.van-grid-item) {
    &.active {
      .van-grid-item__content {
        background-color: #fff2e8;
        border: 1px solid #FF8400;
        border-radius: 8px;
      }
      .van-grid-item__text {
        color: #FF8400;
        font-weight: bold;
      }
    }
  }
  
  :deep(.van-grid-item.active .van-grid-item__content) {
    background-color: #fff2e8 !important;
    border: 1px solid #FF8400 !important;
    border-radius: 8px !important;
  }
  
  .category-icon {
    width: 32px;
    height: 32px;
    object-fit: cover;
  }
  
  .category-icon-fallback {
    width: 32px;
    height: 32px;
    color: #FF8400;
  }
}

.sort-section {
  background-color: #fff;
  padding: 10px 15px;
  margin-bottom: 10px;
}

.sort-options {
  display: flex;
  gap: 10px;
}

.sort-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid #eee;
  border-radius: 16px;
  color: #333;
  background-color: #fff;
  cursor: pointer;
  user-select: none;
}

.sort-option.active {
  border-color: #FF8400;
  color: #FF8400;
  background-color: #fff2e8;
}

.tags-section {
  background: #fff;
  padding: 16px;
  margin-bottom: 8px;
  
  .tags-title {
    font-size: 16px;
    font-weight: bold;
    color: $text-color;
    margin-bottom: 12px;
  }
  
  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    
    .tag-button {
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
      background: #f5f5f5;
      border-radius: 16px;
      font-size: 14px;
      color: $text-color-2;
      transition: all 0.3s;
      cursor: pointer;
      
      &:hover {
        background: #e8e8e8;
      }
      
      &.selected {
        background: $primary-color;
        color: white;
        
        .tag-count {
          background: rgba(255, 255, 255, 0.3);
          color: white;
        }
      }
      
      .tag-name {
        margin-right: 4px;
      }
      
      .tag-count {
        background: $primary-color;
        color: white;
        font-size: 12px;
        padding: 2px 6px;
        border-radius: 10px;
        min-width: 18px;
        text-align: center;
        line-height: 1.2;
      }
    }
  }
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
  flex: 1;
  overflow: auto;
}

.shop-item {
  display: flex;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  
  .shop-image {
    width: 80px;
    height: 80px;
    margin-right: 15px;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 8px;
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
    
    .shop-rating {
      display: flex;
      align-items: center;
      margin-bottom: 5px;
      
      .score-text {
        margin-left: 5px;
        font-size: 12px;
        color: $text-color-2;
      }
    }
    
    .shop-tags {
      font-size: 12px;
      color: $text-color-2;
      margin-top: 2px;
      margin-bottom: 2px;
    }
    
    .shop-price {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .price-text {
        color: $primary-color;
        font-size: 14px;
        font-weight: bold;
      }
      
      .distance {
        color: $text-color-3;
        font-size: 12px;
      }
    }
    
    // 保持向后兼容的样式
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

/* Desktop（PC）样式：更紧凑的尺寸 */
.ignore.search-page {
  /* 根容器：保持原有限宽与居中 */
  width: min(1400px, 96vw);
  margin: 0 auto;
  height: auto;
  min-height: 100vh;
  overflow: visible;
  /* 等比缩放参数：可按需要细调 */
  --pc-scale: 0.82; /* 略小，让除搜索框外的字体略缩小 */
}

/* 仅缩放内部内容：外层容器尺寸不变 */
.ignore.search-page > * {
  transform: scale(var(--pc-scale));
  transform-origin: top center;
  width: calc(100% / var(--pc-scale));
  margin-left: calc((100% - 100% / var(--pc-scale)) / 2);
}

/* 保持搜索框的可读性：不参与全局缩放 */
.ignore.search-page > .search-header { transform: none; width: 100%; margin-left: 0; }
.ignore .search-header {
  position: sticky; top: 0; z-index: 20; padding: 14px 18px 16px; margin-bottom: 16px;
}
.ignore .search-header :deep(.van-search) {
  padding: 0;
}
.ignore .search-header :deep(.van-search__content) {
  height: 54px;
  border-radius: 27px;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 0 16px;
}
.ignore .search-header :deep(.van-field__left-icon) {
  --van-field-icon-size: 24px;
  margin-right: 8px;
  flex-shrink: 0;
}
.ignore .search-header :deep(.van-field__control) {
  height: 54px;
  line-height: 54px;
  font-size: 16px;
}
.ignore .search-header :deep(.van-field__control::placeholder) {
  color: #9aa4b2;
}
.ignore .search-header :deep(.van-search__action) {
  font-size: 16px;
  line-height: 0;
  padding: 0 30px;
}
.ignore .search-header :deep(.van-icon-clear) {
  font-size: 30px !important;
  padding: 0;
}
.ignore .category-section { 
  background:#fff; 
  border-radius:12px;
  padding: 16px 12px 20px 12px; 
  margin-bottom: 0;
  
  :deep(.van-grid-item__content) {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: auto !important;
    min-height: 50px !important;
    max-height: 60px;
  }
  
  .category-icon { width: 73px; height: 73px; }
  :deep(.van-grid-item__text) { font-size: 24px; font-weight: 500; line-height: 1.2; }
  :deep(.van-grid-item) { 
    height: auto !important; 
    min-height: 50px !important;
    width: 20% !important;
    display: flex;
    justify-content: center;
    padding: 0 2.5% !important;
  }
  :deep(.van-grid-item__icon) { height: auto !important; }
  :deep(.van-badge__wrapper) { height: auto; min-height: unset; }
}
.ignore .search-history {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  
  .history-header {
    font-size: 18px;
    margin-bottom: 16px;
    
    span {
      font-weight: 600;
      color: #333;
    }
    
    :deep(.van-icon) {
      font-size: 20px;
      color: #999;
      cursor: pointer;
      
      &:hover {
        color: #FF8400;
      }
    }
  }
  
  .history-tags {
    gap: 12px;
    
    :deep(.van-tag) {
      font-size: 16px;
      padding: 4px 10px;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s;
      line-height: 1.2;
      height: auto;
      min-height: unset;
      
      &:hover {
        background-color: #fff2e8;
        border-color: #FF8400;
        color: #FF8400;
      }
    }
  }
}
.ignore .sort-section {
  background:#fff; 
  border-radius:12px; 
  margin-top: -30px; 
  margin-bottom: -20px; 
  padding: 30px 20px;
  font-size: 24px;
  
  .sort-option {
    gap: 0 !important;
    height: 50px;
  }
}
.ignore .search-results {
  padding: 12px 0 20px; height: auto; overflow: visible; background: transparent;
  flex: none !important;
}

.ignore .search-results :deep(.van-list) {
  display: grid !important;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.ignore .shop-item {
  display:block; background:#fff; border:1px solid #eee; border-radius:12px; padding:12px; transition: box-shadow .2s, transform .2s;
}
.ignore .shop-item:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.06); transform: translateY(-2px); }
.ignore .shop-item .shop-image {
  width:100%; height:220px; margin:0 0 10px 0; object-fit:cover; border-radius:10px;
}
.ignore .shop-item .shop-info { margin-top:0; }
.ignore .shop-item .shop-info .shop-name { font-size: 26px; }
.ignore .shop-item .shop-info .shop-tags { font-size: 24px; }
.ignore .shop-item .shop-info .shop-price .price-text { font-size: 24px; }
.ignore .shop-item .shop-info .shop-rating .score-text { font-size: 24px; }
.ignore .shop-item .shop-info .shop-price .distance { font-size: 24px; }
.ignore .shop-item .shop-info .shop-rating :deep(.van-rate) { font-size: 18px; }

/* PC端标签区域样式 */
.ignore .tags-section {
  margin-bottom: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  
  .tags-title {
    font-size: 18px;
  }
  
  .tag-button {
    font-size: 16px;
    padding: 8px 16px;
    
    &.selected {
      background: $primary-color;
      color: white;
      
      .tag-count {
        background: rgba(255, 255, 255, 0.3);
        color: white;
      }
    }
    
    .tag-count {
      font-size: 14px;
      padding: 3px 8px;
    }
  }
}

/* 移动端：确保内容区占满白底而不是露出左侧橙色背景 */
.search-page { background: $background-color; }
.search-header { background-color: $primary-color; }
</style>