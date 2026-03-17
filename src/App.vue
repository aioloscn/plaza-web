<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useCartStore } from '@/store/modules/cart'

const cartStore = useCartStore()

onMounted(() => {
  cartStore.fetchCartList()
})
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