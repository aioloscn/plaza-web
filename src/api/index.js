import { authApi } from './modules/auth'
import { adminApi, searchCategory, getShopRecommend } from './modules/admin'
import { shopApi } from './modules/shop'
import { productApi } from './modules/product'
import { cartApi } from './modules/cart'
import { addressApi } from './modules/address'

export {
  authApi,
  adminApi,
  shopApi,
  productApi,
  cartApi,
  addressApi,
  searchCategory,  // 单独导出 searchCategory
  getShopRecommend  // 单独导出 getShopRecommend
};