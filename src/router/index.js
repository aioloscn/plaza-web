import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'
import { useUserStore } from '@/store/modules/user'
import { useCartStore } from '@/store/modules/cart'
import { handleOAuthCallbackIfNeeded, startOAuthLogin } from '@/utils/oauth2'

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
  const oauthCallback = await handleOAuthCallbackIfNeeded()
  if (oauthCallback.handled) {
    if (!oauthCallback.success) {
      const failureQuery = typeof oauthCallback.error === 'string' && oauthCallback.error
        ? `?oauth_error=${encodeURIComponent(oauthCallback.error)}`
        : '?oauth_error=1'
      if (to.path !== '/login') {
        return next(`/login${failureQuery}`)
      }
      if (!to.query.oauth_error) {
        const query = {
          oauth_error: oauthCallback.error || '1'
        }
        if (typeof to.query.redirect === 'string' && to.query.redirect) {
          query.redirect = to.query.redirect
        }
        return next({ path: '/login', query })
      }
      return next()
    }
    try {
      await userStore.getUserInfoAction()
      const cartStore = useCartStore()
      await cartStore.mergeCartAfterLogin()
    } catch (e) {
      console.error('OAuth登录后同步用户信息失败', e)
    }
    const targetPath = oauthCallback.redirectPath || '/'
    if (to.fullPath !== targetPath) {
      return next(targetPath)
    }
  }
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

  if (to.path === '/login') {
    if (userStore.isLoggedIn) {
      return next('/')
    }
    const hasCallbackParams = !!to.query.code || !!to.query.state || !!to.query.error
    const shouldAutoOAuth = !hasCallbackParams && !to.query.oauth_error
    if (shouldAutoOAuth) {
      const redirectTarget = typeof to.query.redirect === 'string'
        ? decodeURIComponent(to.query.redirect)
        : '/'
      try {
        await startOAuthLogin(redirectTarget)
        return next(false)
      } catch (oauthError) {
        console.error('登录页自动发起OAuth失败', oauthError)
        const fallbackQuery = {
          ...to.query,
          oauth_error: oauthError?.message || 'oauth_start_failed'
        }
        return next({ path: '/login', query: fallbackQuery })
      }
    }
    return next()
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
        const redirect = encodeURIComponent(to.fullPath)
        return next(`/login?oauth=1&redirect=${redirect}`)
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
