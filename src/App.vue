<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '@/store/modules/cart'

const cartStore = useCartStore()
const route = useRoute()

onMounted(() => {
  // 如果当前是秒杀页面，不查询购物车
  if (!window.location.pathname.includes('/seckill-checkout')) {
    cartStore.fetchCartList()
  }
})

// 当路由发生变化时，如果从秒杀页面回到普通页面，可以再查一次
watch(
  () => route.name,
  (newName, oldName) => {
    if (oldName === 'SeckillCheckout' && newName !== 'SeckillCheckout') {
      cartStore.fetchCartList()
    }
  }
)
</script>

<style lang="scss">
#app {
  width: 100%;
  height: 100%; /* 不再强制 100vh + hidden */
}

/* Desktop: 页面级滚动由浏览器控制 */
@media (min-width: 1024px) {
  #app {
    height: auto;
    min-height: 100vh;
  }
}
</style>