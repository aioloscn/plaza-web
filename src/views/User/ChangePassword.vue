<template>
  <div class="change-password-page" :class="{ ignore: isDesktop }">
    <van-nav-bar
      title="修改密码"
      left-arrow
      @click-left="$router.go(-1)"
      :style="{ backgroundColor: '#FF8400', color: '#fff' }"
    />

    <div class="change-password-form">
      <van-form @submit="handleSubmit">
        <van-cell-group class="custom-group">
          <van-field
            v-model="form.phone"
            name="phone"
            label="手机号"
            label-width="70px"
            readonly
          />
          <van-field
            v-model="form.code"
            name="code"
            label="验证码"
            label-width="70px"
            placeholder="请输入短信验证码"
            :rules="[{ required: true, message: '请输入验证码' }]"
          >
            <template #button>
              <van-button
                size="small"
                color="#FF8400"
                plain
                style="border-radius: 4px; padding: 0 8px; min-width: 80px;"
                :disabled="sms.sending || sms.countdown > 0 || !form.phone"
                @click="sendSmsCode"
              >
                {{ sms.countdown > 0 ? sms.countdown + 's' : '获取验证码' }}
              </van-button>
            </template>
          </van-field>
          <van-field
            v-model="form.newPassword"
            type="password"
            name="newPassword"
            label="新密码"
            label-width="70px"
            placeholder="请输入新密码"
            :rules="[{ required: true, message: '请输入新密码' }]"
          />
          <van-field
            v-model="form.confirmPassword"
            type="password"
            name="confirmPassword"
            label="确认密码"
            label-width="70px"
            placeholder="请再次输入新密码"
            :rules="[{ required: true, message: '请再次输入新密码' }]"
          />
        </van-cell-group>

        <div class="change-password-actions">
          <van-button
            round
            block
            color="#FF8400"
            native-type="submit"
            :loading="loading"
          >
            确认修改
          </van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onUnmounted } from 'vue'
import { showToast } from 'vant'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const isDesktop = ref(typeof window !== 'undefined' ? window.innerWidth >= 1200 : false)
const updateIsDesktop = () => {
  if (typeof window !== 'undefined') {
    isDesktop.value = window.innerWidth >= 1200
  }
}

const form = reactive({
  phone: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})

const sms = reactive({
  sending: false,
  countdown: 0,
  timer: null
})

const sendSmsCode = async () => {
  if (!form.phone) {
    showToast('手机号缺失，请重新登录')
    return
  }
  sms.sending = true
  try {
    await userStore.sendSmsCodeAction(form.phone)
    showToast('验证码已发送，请注意查收')
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

const handleSubmit = async () => {
  if (!form.code || !form.newPassword || !form.confirmPassword) {
    showToast('请填写完整信息')
    return
  }
  if (form.newPassword.length < 8) {
    showToast('新密码至少8位')
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    showToast('两次输入密码不一致')
    return
  }
  loading.value = true
  try {
    await userStore.changePasswordBySmsAction({
      code: form.code,
      newPassword: form.newPassword
    })
    showToast('密码修改成功，请重新登录')
    await userStore.logoutAction()
    router.replace('/login')
  } catch (error) {
    showToast(error.message || '修改密码失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  updateIsDesktop()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateIsDesktop)
  }
  try {
    await userStore.getUserInfoAction()
    form.phone = userStore.userInfo?.phone || ''
  } catch (error) {
    showToast('请先登录')
    router.replace('/login')
  }
})

onUnmounted(() => {
  if (sms.timer) {
    clearInterval(sms.timer)
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateIsDesktop)
  }
})
</script>

<style lang="scss" scoped>
.change-password-page {
  min-height: 100vh;
  background-color: $background-color;
}

.change-password-form {
  padding: 40px 20px;
}

.custom-group {
  margin: 0;
  border-radius: 8px;
  overflow: hidden;
}

.change-password-actions {
  margin-top: 30px;
}

.ignore {
  .change-password-page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    width: 50vw;
    margin: 0 auto;
  }

  .change-password-form {
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
