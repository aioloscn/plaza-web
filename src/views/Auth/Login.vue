<template>
  <!-- 桌面端通过 ignore 禁用 px-to-viewport -->
  <div class="login-page" :class="{ ignore: isDesktop }">
    <!-- 头部导航 -->
    <van-nav-bar
      title="登录"
      left-arrow
      @click-left="$router.go(-1)"
      :style="{ backgroundColor: '#FF8400', color: '#fff' }"
    />

    <!-- 登录表单 -->
    <div class="login-form">
      <van-form @submit="handleLogin">
        <van-cell-group inset>
          <van-field
            v-model="loginForm.telphone"
            name="telphone"
            label="手机号"
            placeholder="请输入手机号"
            :rules="[{ required: true, message: '请输入手机号' }]"
            type="tel"
            maxlength="11"
          />
          <van-field
            v-model="loginForm.password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请输入密码' }]"
          />
        </van-cell-group>

        <div class="login-actions">
          <van-button
            round
            block
            type="warning"
            native-type="submit"
            :loading="loading"
            class="login-btn"
          >
            登录
          </van-button>

          <van-button
            round
            block
            plain
            type="warning"
            class="register-btn"
            @click="$router.push('/register')"
          >
            注册
          </van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/store/modules/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

// 桌面端检测（>=1200px）
const isDesktop = ref(typeof window !== 'undefined' ? window.innerWidth >= 1200 : false)
const updateIsDesktop = () => {
  if (typeof window !== 'undefined') {
    isDesktop.value = window.innerWidth >= 1200
  }
}

// 登录表单数据
const loginForm = reactive({
  telphone: '',
  password: ''
})

// 处理登录
const handleLogin = async () => {
  if (!loginForm.telphone || !loginForm.password) {
    showToast('请填写完整信息')
    return
  }

  loading.value = true
  try {
    await userStore.loginAction(loginForm)
    showToast('登录成功')
    router.push('/')
  } catch (error) {
    showToast(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
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
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background-color: $background-color;
}

.login-form {
  padding: 40px 20px;
}

.login-actions {
  margin-top: 30px;
  
  .login-btn {
    margin-bottom: 15px;
    background-color: $primary-color;
    border-color: $primary-color;
  }
  
  .register-btn {
    color: $primary-color;
    border-color: $primary-color;
  }
}

/* 桌面端样式 */
.ignore {
  .login-page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
+    width: 33.333vw;
+    margin: 0 auto;
  }

  .van-nav-bar {
    padding: 0 16px;
  }

  .login-form {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 16px;
  }

  /* 居中的卡片容器 */
  :deep(.van-form) {
    width: 420px;
    padding: 24px 20px;
    background: #fff;
    border: 1px solid #eee;
    border-radius: 12px;
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  }

  :deep(.van-cell-group--inset) {
    margin: 12px 0 0 0;
  }

  :deep(.van-field) {
    padding: 12px 8px;
    font-size: 16px;
  }

  .login-actions {
    margin-top: 20px;
  }
}
</style>