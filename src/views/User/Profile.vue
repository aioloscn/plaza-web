<template>
  <div class="profile-page">
    <!-- 头部用户信息区域 -->
    <div class="user-header">
      <div class="user-info" @click="handleUserInfoClick">
        <van-image
          round
          width="60"
          height="60"
          :src="userInfo.avatar || 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'"
          class="avatar"
        />
        <div class="info-content">
          <div class="nickname">{{ isLoggedIn ? (userInfo.nickName || '用户' + userInfo.phone?.slice(-4)) : '点击登录/注册' }}</div>
          <div class="phone" v-if="isLoggedIn">{{ userInfo.phone }}</div>
        </div>
        <van-icon name="arrow" class="arrow" v-if="!isLoggedIn" />
      </div>
    </div>

    <!-- 订单入口 -->
    <div class="order-section">
      <van-cell title="我的订单" is-link value="全部订单" to="/order/list" />
      <div class="order-types">
        <div class="type-item">
          <van-icon name="pending-payment" size="24" />
          <span>待付款</span>
        </div>
        <div class="type-item">
          <van-icon name="logistics" size="24" />
          <span>待发货</span>
        </div>
        <div class="type-item">
          <van-icon name="tosend" size="24" />
          <span>待收货</span>
        </div>
        <div class="type-item">
          <van-icon name="comment-o" size="24" />
          <span>待评价</span>
        </div>
        <div class="type-item">
          <van-icon name="after-sale" size="24" />
          <span>退款/售后</span>
        </div>
      </div>
    </div>

    <!-- 常用功能 -->
    <div class="menu-group">
      <van-cell title="收货地址" icon="location-o" is-link to="/address" />
      <van-cell title="我的收藏" icon="star-o" is-link />
      <van-cell title="优惠券" icon="coupon-o" is-link />
      <van-cell title="联系客服" icon="service-o" is-link />
    </div>

    <!-- 设置与退出 -->
    <div class="menu-group" v-if="isLoggedIn">
      <van-cell title="退出登录" icon="revoke" is-link @click="handleLogout" />
    </div>

    <!-- 底部导航栏 -->
    <van-tabbar v-model="active" route fixed placeholder>
      <van-tabbar-item icon="home-o" to="/">首页</van-tabbar-item>
      <van-tabbar-item icon="apps-o" to="/category">分类</van-tabbar-item>
      <van-tabbar-item icon="shopping-cart-o" to="/cart">购物车</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/user">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showDialog, showToast } from 'vant'
import { useUserStore } from '@/store/modules/user'

const router = useRouter()
const userStore = useUserStore()
const active = ref(3)

const isLoggedIn = computed(() => userStore.isLoggedIn)
const userInfo = computed(() => userStore.userInfo)

const handleUserInfoClick = () => {
  if (!isLoggedIn.value) {
    router.push('/login')
  }
}

const handleLogout = () => {
  showDialog({
    title: '提示',
    message: '确认退出登录吗？',
    showCancelButton: true,
  }).then(async (action) => {
    if (action === 'confirm') {
      await userStore.logoutAction()
      showToast('已退出登录')
      router.replace('/login')
    }
  })
}

onMounted(async () => {
    // 无论如何，尝试获取一次用户信息，以确保状态同步
    try {
      await userStore.getUserInfoAction()
    } catch (e) {
      // 忽略未登录错误
    }
  })
</script>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;

  .user-header {
    background: linear-gradient(to right, #ff9000, #ff5000);
    padding: 30px 20px;
    color: #fff;

    .user-info {
      display: flex;
      align-items: center;

      .avatar {
        border: 2px solid rgba(255, 255, 255, 0.5);
      }

      .info-content {
        flex: 1;
        margin-left: 15px;

        .nickname {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .phone {
          font-size: 14px;
          opacity: 0.8;
        }
      }

      .arrow {
        font-size: 16px;
        opacity: 0.8;
      }
    }
  }

  .order-section {
    margin: 12px;
    background: #fff;
    border-radius: 8px;
    overflow: hidden;

    .order-types {
      display: flex;
      padding: 15px 0;

      .type-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        font-size: 12px;
        color: #666;

        .van-icon {
          margin-bottom: 6px;
          color: #ff9000;
        }
      }
    }
  }

  .menu-group {
    margin: 12px;
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
  }
}
</style>