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
  
  // 如果 URL 中携带了 token（例如从 badger-web 登录成功回跳）
  if (to.query.token) {
    userStore.setToken(to.query.token)
    // 移除 URL 中的 token，保持地址栏干净
    const query = { ...to.query }
    delete query.token
    
    try {
      await userStore.getUserInfoAction()
      // 登录成功后，触发购物车合并逻辑
      const cartStore = useCartStore()
      await cartStore.mergeCartAfterLogin()
    } catch (e) {
      console.error('获取用户信息失败', e)
    }
    
    return next({ path: to.path, query })
  }
  
  // 需要登录的页面
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router