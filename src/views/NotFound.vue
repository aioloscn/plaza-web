<template>
  <div class="not-found-page">
    <van-nav-bar
      title="页面未找到"
      left-arrow
      @click-left="$router.go(-1)"
      :style="{ backgroundColor: '#FF8400', color: '#fff' }"
    />
    
    <div class="not-found-content">
      <van-empty
        image="error"
        description="抱歉，您访问的页面不存在"
      >
        <van-button
          round
          type="warning"
          class="bottom-button"
          @click="$router.push('/')"
        >
          返回首页
        </van-button>
      </van-empty>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style lang="scss" scoped>
.not-found-page {
  min-height: 100vh;
  background-color: $background-color;
}

.not-found-content {
  padding: 60px 20px;
  text-align: center;
}

.bottom-button {
  width: 160px;
  margin-top: 20px;
  background-color: $primary-color;
  border-color: $primary-color;
}
</style>