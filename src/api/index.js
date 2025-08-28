import { authApi } from './modules/auth'
import { adminApi, searchCategory, getShopRecommend } from './modules/admin'
import { searchApi } from './modules/search'
import { shopApi } from './modules/shop'

export {
  authApi,
  adminApi,
  searchApi,
  shopApi,
  searchCategory,  // 单独导出 searchCategory
  getShopRecommend  // 单独导出 getShopRecommend
};