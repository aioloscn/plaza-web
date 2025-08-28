<template>
  <div class="home-page">
    <!-- 头部搜索栏 -->
    <div class="home-header">
      <div class="header-content">
        <div class="city-selector" @click="showCityPicker">
          <span class="city-name">{{ currentCity }}</span>
          <van-icon name="arrow-down" size="12" />
        </div>
        <van-search
          v-model="searchValue"
          placeholder="搜索商家、美食"
          background="transparent"
          @click="$router.push('/search')"
          readonly
        />
      </div>
    </div>

    <!-- 轮播图 -->
    <van-swipe class="home-swipe" :autoplay="3000" indicator-color="white">
      <van-swipe-item v-for="(banner, index) in banners" :key="index">
        <img :src="banner.image" :alt="banner.title" />
      </van-swipe-item>
    </van-swipe>

    <!-- 功能入口 -->
    <div class="home-grid">
      <van-grid :column-num="4" :border="false">
        <van-grid-item
          v-for="(item, index) in gridItems"
          :key="index"
          :text="item.text"
          @click="handleGridClick(item)"
        >
          <template #icon>
            <img 
              :src="item.icon" 
              :alt="item.text"
              class="grid-icon"
              @error="handleImageError($event, item)"
            />
          </template>
        </van-grid-item>
      </van-grid>
    </div>

    <!-- 商家列表 -->
    <div class="shop-list" @scroll="handleScroll">
      <div class="list-title">
        <span>{{ userLocation ? '附近推荐' : '猜你喜欢' }}</span>
      </div>
      <div
        v-for="(shop, index) in shopList"
        :key="shop.id || index"
        class="shop-item"
        @click="$router.push(`/shop/${shop.id}`)"
      >
        <div class="shop-image">
          <img :src="shop.iconUrl || shop.image || '/images/shop-default.svg'" :alt="shop.name" @error="handleShopImageError" />
        </div>
        <div class="shop-info">
          <div class="shop-name">{{ shop.name }}</div>
          <div class="shop-rating" v-if="shop.score !== undefined">
            <van-rate v-model="shop.score" :readonly="true" :size="14" color="#ffd21e" void-color="#eee" />
            <span class="score-text">({{ shop.score }})</span>
          </div>
          <div class="shop-tags" v-if="shop.tags">{{ shop.tags }}</div>
          <div class="shop-price">
            <span class="price-text">人均¥{{ shop.perCapitaPrice || shop.pricePerMan || shop.price }}</span>
            <span v-if="shop.distanceText" class="distance">{{ shop.distanceText }}</span>
          </div>
        </div>
      </div>
      <div v-if="loading" class="loading-text">加载中...</div>
      <div v-if="finished" class="finished-text">没有更多了</div>
    </div>

    <!-- 底部导航 -->
    <van-tabbar v-model="activeTab" @change="onTabChange" fixed>
      <van-tabbar-item icon="home-o" to="/">首页</van-tabbar-item>
      <van-tabbar-item icon="search" to="/search">搜索</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/user">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { searchCategory, getShopRecommend } from '@/api';
import { shopApi } from '@/api';
import { GeolocationService } from '@/utils/geolocation';
import { showToast, showLoadingToast, closeToast } from 'vant';

const router = useRouter();

// 响应式数据
const searchValue = ref('');
const activeTab = ref(0);
const loading = ref(false);
const finished = ref(false);
const categories = ref([]);
const userLocation = ref(null); // 用户位置信息
const shopList = ref([]);
const currentPage = ref(1); // 当前页码
const currentCity = ref('上海'); // 当前城市

// 轮播图数据
const banners = ref([
  { image: '/images/banner1.svg', title: '美食推荐' },
  { image: '/images/banner2.svg', title: '酒店住宿' },
  { image: '/images/banner3.svg', title: '团购优惠' }
])

// 功能网格数据 - 先设置一些默认数据确保页面有内容显示
const gridItems = ref([
  { icon: 'shop-o', text: '美食', type: 'food', id: 1 },
  { icon: 'hotel-o', text: '酒店', type: 'hotel', id: 2 },
  { icon: 'gift-o', text: '团购', type: 'group', id: 3 },
  { icon: 'star-o', text: '娱乐', type: 'entertainment', id: 4 }
])

// 新增：获取分类数据
const fetchCategories = async () => {
  console.log('🚀 开始获取分类数据...')
  try {
    console.log('📡 调用searchCategory API...')
    const response = await searchCategory()
    console.log('✅ API响应成功:', response)
    
    const data = response.data || response
    categories.value = data
    console.log('📊 处理后的分类数据:', data)
    
    // 将分类数据映射到网格组件
    if (data && Array.isArray(data) && data.length > 0) {
      const mappedData = data.map((category, index) => ({
        icon: category.iconUrl || 'shop-o',  // 使用API返回的iconUrl字段
        text: category.name || category.title || `分类${index + 1}`,
        type: category.type || category.id || `type_${index}`,
        id: category.id || index
      }))
      gridItems.value = mappedData
      console.log('🎯 成功映射网格数据:', mappedData)
      console.log('🖼️ 使用的图标URL:', mappedData.map(item => ({ text: item.text, icon: item.icon })))
    } else {
      console.log('⚠️ API返回数据为空或格式不正确，保持默认数据')
    }
  } catch (error) {
    console.error('❌ 获取分类失败:', error)
    console.error('📋 错误详情:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    })
    console.log('🔄 保持使用默认网格数据')
  }
}

// 处理网格点击
const handleGridClick = (item) => {
  // 根据类型跳转到不同页面
  console.log('点击了:', item.text)
}

// 处理图片加载错误
const handleImageError = (event, item) => {
  console.log('图片加载失败:', item.icon)
  // 使用默认图标作为后备
  event.target.style.display = 'none'
  event.target.parentNode.innerHTML = `<van-icon name="shop-o" size="24" />`
}

// 处理底部导航切换
const onTabChange = (index) => {
  console.log('切换到标签:', index)
}

// 滚动监听函数
const handleScroll = (event) => {
  const { scrollTop, scrollHeight, clientHeight } = event.target;
  // 当滚动到底部时触发加载更多
  if (scrollTop + clientHeight >= scrollHeight - 10 && !loading.value && !finished.value) {
    loadMoreShops();
  }
};

// 加载更多商家列表
const loadMoreShops = async () => {
  console.log('🔄 开始加载更多商家数据');
  
  if (finished.value || loading.value) {
    console.log('⏸️ 跳过加载：', finished.value ? '已完成' : '正在加载中');
    return;
  }
  
  const nextPage = currentPage.value + 1;
  console.log('📄 准备加载第', nextPage, '页');
  
  loading.value = true;
  
  try {
    const requestData = {
      page: {
        current: nextPage,
        size: 10
      },
      data: {
        longitude: userLocation.value?.longitude || 121.4737,
        latitude: userLocation.value?.latitude || 31.2304
      }
    };
    
    console.log('🔄 加载更多店铺数据:', requestData);
    const response = await getShopRecommend(requestData);
    console.log('✅ 更多店铺数据响应:', response);
    
    if (response && response.data && response.data.records && response.data.records.length > 0) {
      const newShops = response.data.records.map(shop => ({
        ...shop,
        // 确保字段映射正确
        name: shop.name || shop.shopName || shop.title || '未知店铺',
        score: shop.score || shop.rating || shop.star || 0,
        perCapitaPrice: shop.perCapitaPrice || shop.avgPrice || shop.price || 0,
        tags: shop.tags || shop.category || shop.type || '',
        iconUrl: shop.iconUrl || shop.image || shop.avatar || '/images/shop-default.svg',
        distanceText: shop.distance || ''
      }));
      shopList.value.push(...newShops);
      currentPage.value = nextPage; // 更新当前页码
      console.log('🏪 成功加载更多店铺:', newShops.length, '个，总数:', shopList.value.length);
      
      // 根据API返回的hasNext字段判断是否还有更多数据
      if (!response.data.hasNext) {
        finished.value = true;
        console.log('📄 没有更多数据了');
      }
    } else {
      console.log('📄 没有更多数据了');
      finished.value = true;
    }
  } catch (error) {
    console.error('❌ 加载更多商家失败:', error);
    // API失败时使用模拟数据进行分页
    console.log('🔄 API失败，使用模拟数据分页');
    const startIndex = (nextPage - 1) * 10;
    const endIndex = startIndex + 10;
    const totalMockData = 30; // 总共30条模拟数据
    
    if (startIndex < totalMockData) {
      const mockShops = [];
      for (let i = startIndex + 1; i <= Math.min(endIndex, totalMockData); i++) {
        mockShops.push({
          id: i,
          name: `商家${i}`,
          tags: i % 3 === 0 ? '美食·火锅' : i % 2 === 0 ? '饮品·咖啡' : '美食·快餐',
          perCapitaPrice: 30 + (i * 5),
          score: 4.0 + (Math.random() * 1),
          iconUrl: '/images/shop-default.svg',
          distanceText: `${(Math.random() * 3 + 0.5).toFixed(1)}km`
        });
      }
      shopList.value.push(...mockShops);
      currentPage.value = nextPage;
      console.log('🏪 成功加载模拟数据:', mockShops.length, '个，总数:', shopList.value.length);
      
      // 检查是否还有更多数据
      if (endIndex >= totalMockData) {
        finished.value = true;
        console.log('📄 模拟数据已全部加载完成');
      }
    } else {
      finished.value = true;
      console.log('📄 没有更多模拟数据了');
    }
  } finally {
    loading.value = false;
    console.log('✅ 加载完成，当前状态:', { 
      loading: loading.value, 
      finished: finished.value, 
      currentPage: currentPage.value,
      shopListLength: shopList.value.length 
    });
  }
}

/**
 * 获取用户地理位置
 */
const getUserLocation = async () => {
  try {
    showLoadingToast({
      message: '正在获取位置信息...',
      forbidClick: true,
    });
    
    const position = await GeolocationService.getCurrentPosition();
    userLocation.value = position;
    
    // 根据经纬度获取城市名称
    await getCityNameByLocation(position.longitude, position.latitude);
    
    // 获取位置成功后，加载附近商家
    await loadNearbyShops(position.longitude, position.latitude);
    
    closeToast();
  } catch (error) {
    closeToast();
    console.error('获取位置失败:', error);
    showToast('获取位置失败，将显示默认推荐');
    // 位置获取失败时，加载默认商家列表
    await loadDefaultShops();
  }
};

/**
 * 加载附近商家
 */
const loadNearbyShops = async (longitude, latitude) => {
  try {
    // 重置分页状态
    currentPage.value = 1; // 设置为1，表示已加载第一页
    finished.value = false;
    loading.value = false; // 确保loading状态正确
    
    const requestData = {
      page: {
        current: 1,
        size: 10
      },
      data: {
        longitude: longitude || 0,
        latitude: latitude || 0
      }
    };
    
    console.log('🏪 调用店铺推荐API:', requestData);
    const response = await getShopRecommend(requestData);
    console.log('✅ 店铺推荐API响应:', response);
    
    if (response && response.data && response.data.records) {
      console.log('🔍 API返回的原始数据结构:', response.data.records[0]); // 打印第一个店铺的数据结构
      const shops = response.data.records.map(shop => ({
        ...shop,
        // 确保字段映射正确
        name: shop.name || shop.shopName || shop.title || '未知店铺',
        score: shop.score || shop.rating || shop.star || 0,
        perCapitaPrice: shop.perCapitaPrice || shop.avgPrice || shop.price || 0,
        tags: shop.tags || shop.category || shop.type || '',
        iconUrl: shop.iconUrl || shop.image || shop.avatar || '/images/shop-default.svg',
        distanceText: shop.distance || ''
      }));
      shopList.value = shops;
      currentPage.value = 1; // 设置当前页为1
      console.log('🏪 成功加载店铺列表:', shops);
      console.log('🏪 处理后的第一个店铺数据:', shops[0]);
      
      // 根据API返回的hasNext字段判断是否还有更多数据
      if (!response.data.hasNext) {
        finished.value = true;
        console.log('📄 当前页已是最后一页');
      }
    } else {
      console.log('⚠️ 店铺推荐API返回数据为空');
      await loadDefaultShops();
    }
  } catch (error) {
    console.error('❌ 加载附近商家失败:', error);
    showToast('获取附近商家失败');
    await loadDefaultShops();
  }
}

/**
 * 加载默认商家列表（仅在定位失败时使用模拟数据）
 */
const loadDefaultShops = async () => {
  console.log('🏪 定位失败，使用模拟店铺数据');
  // 重置分页状态
  currentPage.value = 1;
  finished.value = false;
  
  // 创建更多模拟数据以支持分页测试
  const mockShops = [];
  for (let i = 1; i <= 30; i++) {
    mockShops.push({
      id: i,
      name: `商家${i}`,
      tags: i % 3 === 0 ? '美食·火锅' : i % 2 === 0 ? '饮品·咖啡' : '美食·快餐',
      perCapitaPrice: 30 + (i * 5),
      score: 4.0 + (Math.random() * 1),
      iconUrl: '/images/shop-default.svg',
      distanceText: `${(Math.random() * 3 + 0.5).toFixed(1)}km`
    });
  }
  
  // 只显示前10个，模拟第一页数据
  shopList.value = mockShops.slice(0, 10);
  console.log('🏪 成功加载模拟店铺列表，共', shopList.value.length, '个');
};

// 根据经纬度获取城市名称
const getCityNameByLocation = async (longitude, latitude) => {
  try {
    console.log('根据经纬度获取城市:', longitude, latitude);
    
    // 简单的经纬度到城市映射（实际项目中应该使用地理编码API）
    const cityMap = {
      // 上海范围
      '121.4737,31.2304': '上海',
      // 北京范围  
      '116.4074,39.9042': '北京',
      // 广州范围
      '113.2644,23.1291': '广州',
      // 深圳范围
      '114.0579,22.5431': '深圳',
      // 杭州范围
      '120.1551,30.2741': '杭州'
    };
    
    // 查找最接近的城市
    let closestCity = '上海'; // 默认城市
    let minDistance = Infinity;
    
    for (const [coords, city] of Object.entries(cityMap)) {
      const [lng, lat] = coords.split(',').map(Number);
      const distance = Math.sqrt(
        Math.pow(longitude - lng, 2) + Math.pow(latitude - lat, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestCity = city;
      }
    }
    
    currentCity.value = closestCity;
    console.log('获取到城市名称:', currentCity.value);
    
  } catch (error) {
    console.error('获取城市名称失败:', error);
    // 保持默认城市名称
  }
};

// 处理店铺图片加载错误
const handleShopImageError = (event) => {
  event.target.src = '/images/shop-default.svg';
};

// 显示城市选择器
const showCityPicker = () => {
  showToast('城市选择功能开发中...');
};

// 页面加载时的初始化
onMounted(async () => {
  await fetchCategories();
  await getUserLocation(); // 获取用户位置并加载附近商家
});
</script>

<style lang="scss" scoped>
.home-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.home-header {
  background-color: #FF8400;
  padding: 10px;
  
  .header-content {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .city-selector {
    display: flex;
    align-items: center;
    gap: 4px;
    color: white;
    font-size: 14px;
    white-space: nowrap;
    cursor: pointer;
    
    .city-name {
      font-weight: 500;
    }
  }
  
  :deep(.van-search) {
    flex: 1;
    padding: 0;
    
    .van-search__content {
      background-color: rgba(255, 255, 255, 0.9);
      border-radius: 20px;
    }
  }
}

.home-swipe {
  height: 200px;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.home-grid {
  background-color: #fff;
  margin: 10px 0;
  padding: 15px 0;
}

.grid-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 4px;
}

.shop-list {
  flex: 1;
  overflow-y: auto;
  background-color: #f8f8f8;
  height: 0;
  
  .list-title {
    padding: 15px;
    background-color: #fff;
    font-size: 16px;
    font-weight: bold;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .loading-text, .finished-text {
    text-align: center;
    padding: 20px;
    color: #999;
    font-size: 14px;
    background-color: #fff;
  }
}

.shop-item {
  display: flex;
  padding: 15px;
  background-color: #fff;
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
      margin-bottom: 8px;
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
  }
}
</style>