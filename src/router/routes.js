const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home/index.vue'),
    meta: {
      title: '首页',
      keepAlive: true
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Auth/Login.vue'),
    meta: {
      title: '登录'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Auth/Register.vue'),
    meta: {
      title: '注册'
    }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/Search/index.vue'),
    meta: {
      title: '搜索'
    }
  },
  {
    path: '/shop/:id',
    name: 'ShopDetail',
    component: () => import('@/views/Shop/Detail.vue'),
    meta: {
      title: '商家详情'
    }
  },
  {
    path: '/user',
    name: 'UserProfile',
    component: () => import('@/views/User/Profile.vue'),
    meta: {
      title: '个人中心',
      requiresAuth: true
    }
  },
  {
    path: '/checkout/:shopId',
    name: 'Checkout',
    component: () => import('@/views/Order/Checkout.vue'),
    meta: {
      title: '确认订单',
      requiresAuth: true
    }
  },
  {
    path: '/address/list',
    name: 'AddressList',
    component: () => import('@/views/Address/List.vue'),
    meta: {
      title: '收货地址',
      requiresAuth: true
    }
  },
  {
    path: '/address/edit',
    name: 'AddressEdit',
    component: () => import('@/views/Address/Edit.vue'),
    meta: {
      title: '编辑地址',
      requiresAuth: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

export default routes