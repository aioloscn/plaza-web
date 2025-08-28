<template>
  <div class="register-page">
    <!-- 头部导航 -->
    <van-nav-bar
      title="注册"
      left-arrow
      @click-left="$router.go(-1)"
      :style="{ backgroundColor: '#FF8400', color: '#fff' }"
    />

    <!-- 注册表单 -->
    <div class="register-form">
      <van-form @submit="handleRegister">
        <van-cell-group inset>
          <van-field
            v-model="registerForm.telphone"
            name="telphone"
            label="手机号"
            placeholder="请输入手机号"
            :rules="[{ required: true, message: '请输入手机号' }]"
            type="tel"
            maxlength="11"
          />
          <van-field
            v-model="registerForm.password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请输入密码' }]"
          />
          <van-field
            v-model="registerForm.nickName"
            name="nickName"
            label="昵称"
            placeholder="请输入昵称"
            :rules="[{ required: true, message: '请输入昵称' }]"
          />
          <van-field
            v-model="registerForm.gender"
            name="gender"
            label="性别"
            placeholder="请选择性别"
            readonly
            is-link
            @click="showGenderPicker = true"
            :rules="[{ required: true, message: '请选择性别' }]"
          />
        </van-cell-group>

        <div class="register-actions">
          <van-button
            round
            block
            type="warning"
            native-type="submit"
            :loading="loading"
            class="register-btn"
          >
            注册
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- 性别选择器 -->
    <van-popup v-model:show="showGenderPicker" position="bottom">
      <van-picker
        :columns="genderOptions"
        @confirm="onGenderConfirm"
        @cancel="showGenderPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { register } from '@/api/modules/auth'

const router = useRouter()
const loading = ref(false)
const showGenderPicker = ref(false)

// 性别选项
const genderOptions = [
  { text: '男', value: '1' },
  { text: '女', value: '2' }
]

// 注册表单数据
const registerForm = reactive({
  telphone: '',
  password: '',
  nickName: '',
  gender: ''
})

// 性别选择确认
const onGenderConfirm = ({ selectedOptions }) => {
  registerForm.gender = selectedOptions[0].value
  showGenderPicker.value = false
}

// 处理注册
const handleRegister = async () => {
  if (!registerForm.telphone || !registerForm.password || !registerForm.nickName || !registerForm.gender) {
    showToast('请填写完整信息')
    return
  }

  loading.value = true
  try {
    await register(registerForm)
    showToast('注册成功')
    router.push('/login')
  } catch (error) {
    showToast(error.message || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.register-page {
  min-height: 100vh;
  background-color: $background-color;
}

.register-form {
  padding: 40px 20px;
}

.register-actions {
  margin-top: 30px;
  
  .register-btn {
    background-color: $primary-color;
    border-color: $primary-color;
  }
}
</style>