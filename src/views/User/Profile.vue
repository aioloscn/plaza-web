<template>
  <!-- 添加 ignore 命名空间以在桌面端禁用 px-to-viewport 转换 -->
  <div class="profile-page" :class="{ ignore: isDesktop }">
    <!-- 头部导航 -->
    <van-nav-bar
      title="个人中心"
      left-arrow
      @click-left="$router.go(-1)"
      :style="{ backgroundColor: '#FF8400', color: '#fff' }"
    />

    <!-- 用户信息 -->
    <div class="user-info">
      <div class="user-avatar">
        <van-image
          :src="userInfo.avatar || '/src/assets/images/default-avatar.png'"
          round
          width="60"
          height="60"
        />
      </div>
      <div class="user-details">
        <h3 class="username">{{ userInfo.nickName || '未登录' }}</h3>
        <p class="user-phone">{{ userInfo.telphone || '请先登录' }}</p>
      </div>
      <div class="user-action">
        <van-button
          v-if="!isLoggedIn"
          type="warning"
          size="small"
          round
          @click="$router.push('/login')"
        >
          登录
        </van-button>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="menu-section">
      <van-cell-group>
        <van-cell
          title="我的订单"
          icon="orders-o"
          is-link
          @click="showToast('功能开发中')"
        />
        <van-cell
          title="我的收藏"
          icon="star-o"
          is-link
          @click="showToast('功能开发中')"
        />
        <van-cell
          title="收货地址"
          icon="location-o"
          is-link
          @click="showToast('功能开发中')"
        />
        <van-cell
          title="优惠券"
          icon="coupon-o"
          is-link
          @click="showToast('功能开发中')"
        />
      </van-cell-group>
    </div>

    <!-- 设置菜单 -->
    <div class="menu-section">
      <van-cell-group>
        <van-cell
          title="设置"
          icon="setting-o"
          is-link
          @click="showToast('功能开发中')"
        />
        <van-cell
          title="帮助与反馈"
          icon="question-o"
          is-link
          @click="showToast('功能开发中')"
        />
        <van-cell
          title="关于我们"
          icon="info-o"
          is-link
          @click="showToast('功能开发中')"
        />
      </van-cell-group>
    </div>

    <!-- 退出登录 -->
    <div v-if="isLoggedIn" class="logout-section">
      <van-button
        type="danger"
        block
        round
        @click="handleLogout"
        :loading="logoutLoading"
      >
        退出登录
      </van-button>
    </div>

    <!-- 底部导航（桌面端隐藏） -->
    <van-tabbar v-if="!isDesktop" v-model="activeTab">
      <van-tabbar-item icon="home-o" to="/">首页</van-tabbar-item>
      <van-tabbar-item icon="search" to="/search">搜索</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/user">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { useUserStore } from '@/store/modules/user'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref(2)
const logoutLoading = ref(false)

const isLoggedIn = computed(() => userStore.isLoggedIn)
const userInfo = computed(() => userStore.userInfo)

// 桌面端检测（>=1200px）
const isDesktop = ref(typeof window !== 'undefined' ? window.innerWidth >= 1200 : false)
const updateIsDesktop = () => {
  if (typeof window !== 'undefined') {
    isDesktop.value = window.innerWidth >= 1200
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await showConfirmDialog({
      title: '提示',
      message: '确定要退出登录吗？'
    })
    
    logoutLoading.value = true
    await userStore.logoutAction()
    showToast('已退出登录')
    router.push('/')
  } catch (error) {
    // 用户取消
  } finally {
    logoutLoading.value = false
  }
}

onMounted(() => {
  // 监听窗口变化，切换 PC/H5 样式
  updateIsDesktop()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateIsDesktop)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateIsDesktop)
  }
})

onMounted(() => {
  // 如果已登录但没有用户信息，获取用户信息
  if (isLoggedIn.value && !userInfo.value.nickName) {
    userStore.getUserInfoAction().catch(() => {
      // 获取用户信息失败，可能token已过期
    })
  }
})
</script>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background-color: $background-color;
  padding-bottom: 60px;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: #fff;
  margin-bottom: 10px;
  
  .user-avatar {
    margin-right: 15px;
  }
  
  .user-details {
    flex: 1;
    
    .username {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
      color: $text-color;
    }
    
    .user-phone {
      font-size: 14px;
      color: $text-color-2;
    }
  }
}

.menu-section {
  margin-bottom: 10px;
}

.logout-section {
  padding: 20px;
  
  .van-button {
    margin-top: 20px;
  }
}

/* 桌面端样式（通过 .ignore 禁用 px-to-viewport 转换） */
.ignore {
  .profile-page {
    max-width: 1200px;
    margin: 0 auto;
    padding-bottom: 24px; /* 桌面端隐藏 Tabbar，因此减少底部留白 */
  }

  .van-nav-bar {
    padding: 0 16px;
  }

  .user-info {
    max-width: 1200px;
    margin: 24px auto;
    padding: 24px;
    border: 1px solid #eee;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

    .user-avatar {
      margin-right: 20px;

      /* 放大头像尺寸 */
      .van-image {
        width: 96px !important;
        height: 96px !important;
      }
    }

    .user-details {
      .username {
        font-size: 20px;
      }

      .user-phone {
        font-size: 14px;
      }
    }
  }

  .menu-section {
    max-width: 1200px;
    margin: 16px auto;
    padding: 0 16px;

    /* 增强桌面端单元样式的触达面积与对比度 */
    :deep(.van-cell) {
      font-size: 16px;
      padding: 16px 12px;
    }
  }

  .logout-section {
    max-width: 600px;
    margin: 24px auto 48px;
  }

  /* 双保险：即使忘记 v-if 也不显示 Tabbar */
  :deep(.van-tabbar) {
    display: none;
  }
}
</style>