import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'
import { useUserStore } from '@/store/modules/user'
import { useCartStore } from '@/store/modules/cart'

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const fromLoginCenter = to.query.loginStatus === 'success' || !!to.query.token
  if (fromLoginCenter) {
    const query = { ...to.query }
    delete query.token
    delete query.loginStatus
    delete query.from
    delete query.userId
    try {
      await userStore.getUserInfoAction()
      const cartStore = useCartStore()
      await cartStore.mergeCartAfterLogin()
    } catch (e) {
      console.error('登录回跳后同步用户信息失败', e)
    }
    return next({ path: to.path, query })
  }
  
  // 需要登录的页面
  if (to.meta.requiresAuth) {
    if (userStore.isLoggedIn) {
      next()
    } else {
      // 尝试获取用户信息（针对 Cookie 登录模式）
      try {
        await userStore.getUserInfoAction()
        // 获取成功，继续导航
        next()
      } catch (e) {
        // 获取失败，跳转登录页
        const redirect = encodeURIComponent(to.fullPath)
        next(`/login?redirect=${redirect}`)
      }
    }
  } else {
    // 不需要登录的页面，也可以尝试获取用户信息更新状态（可选，但推荐）
    if (!userStore.isLoggedIn && !userStore.userInfo.userId) {
       // 异步获取，不阻塞页面跳转
       userStore.getUserInfoAction().catch(() => {})
    }
    next()
  }
})

export default router
