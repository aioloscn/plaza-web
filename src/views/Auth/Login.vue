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
        <van-cell-group class="custom-group">
          <van-field
            v-model="loginForm.phone"
            name="phone"
            label="手机号"
            label-width="60px"
            placeholder="请输入手机号"
            :rules="[{ required: true, message: '请输入手机号' }]"
            type="tel"
            maxlength="11"
          />
          <van-field
            v-model="loginForm.code"
            center
            clearable
            label="验证码"
            label-width="60px"
            placeholder="请输入短信验证码"
            :rules="[{ required: true, message: '请输入验证码' }]"
          >
            <template #button>
              <van-button 
                size="small" 
                color="#FF8400"
                plain
                style="border-radius: 4px; padding: 0 8px; min-width: 80px;"
                :disabled="sms.sending || sms.countdown > 0" 
                @click="sendSmsCode"
              >
                {{ sms.countdown > 0 ? sms.countdown + 's' : '获取验证码' }}
              </van-button>
            </template>
          </van-field>
        </van-cell-group>

        <div class="login-actions">
          <van-button
            round
            block
            color="#FF8400"
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
            color="#FF8400"
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
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/store/modules/user'
import { useCartStore } from '@/store/modules/cart'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const cartStore = useCartStore()
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
  phone: '',
  code: ''
})

// 短信验证码状态
const sms = reactive({
  sending: false,
  countdown: 0,
  timer: null
})

// 发送短信验证码
const sendSmsCode = async () => {
  if (!loginForm.phone) {
    showToast('请输入手机号')
    return
  }
  if (!/^1[3-9]\d{9}$/.test(loginForm.phone)) {
    showToast('手机号格式不正确')
    return
  }

  sms.sending = true
  try {
    await userStore.sendSmsCodeAction(loginForm.phone)
    showToast('验证码已发送，请注意查收')
    
    // 开始倒计时
    sms.countdown = 60
    sms.timer = setInterval(() => {
      sms.countdown--
      if (sms.countdown <= 0) {
        clearInterval(sms.timer)
      }
    }, 1000)
  } catch (error) {
    showToast(error.message || '发送验证码失败')
  } finally {
    sms.sending = false
  }
}

// 处理登录
const handleLogin = async () => {
  if (!loginForm.phone || !loginForm.code) {
    showToast('请填写完整信息')
    return
  }
  if (!/^1[3-9]\d{9}$/.test(loginForm.phone)) {
    showToast('手机号格式不正确')
    return
  }

  loading.value = true
  try {
    await userStore.loginAction(loginForm)
    await cartStore.mergeCartAfterLogin()
    showToast('登录成功')
    
    // 登录成功后返回上一页或首页
    const redirect = route.query.redirect
    if (redirect) {
      // 解码可能被编码的 redirect URL
      const decodedRedirect = decodeURIComponent(redirect)
      // 如果是完整的 URL（包含 http/https），则进行 window.location 跳转
      if (decodedRedirect.startsWith('http')) {
        window.location.href = decodedRedirect
      } else {
        router.replace(decodedRedirect)
      }
    } else {
      router.replace('/')
    }
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

.custom-group {
  margin: 0;
  border-radius: 8px;
  overflow: hidden;
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
    width: 50vw;
    margin: 0 auto;
  }

  .van-nav-bar {
    padding: 0 16px;
  }

  .login-form {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 24px;
  }

  :deep(.van-form) {
    width: 420px;
    padding: 24px;
    background: #fff;
    border: 1px solid #eee;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }
}
</style>
