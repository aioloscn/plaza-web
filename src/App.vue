<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
// 应用根组件
</script>

<style lang="scss">
#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* Desktop: 页面级滚动由浏览器控制，而非内部容器 */
@media (min-width: 1024px) {
  #app {
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }
  html, body {
    /* 避免任何子元素微小溢出引起横向滚动条 */
    overflow-x: hidden;
  }
}
</style>