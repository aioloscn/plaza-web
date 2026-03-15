import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { cartApi } from '@/api'
import { useUserStore } from './user'

export const useCartStore = defineStore('cart', () => {
  // 从本地存储初始化购物车数据
  const items = ref(JSON.parse(localStorage.getItem('cart_items') || '[]'))

  // 监听数据变化并持久化到 localStorage
  watch(items, (newVal) => {
    localStorage.setItem('cart_items', JSON.stringify(newVal))
    syncToBackend(newVal)
  }, { deep: true })

  // 获取临时用户ID（未登录时使用）
  const getTempId = () => {
    let tid = localStorage.getItem('temp_user_id')
    if (!tid) {
      tid = 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
      localStorage.setItem('temp_user_id', tid)
    }
    return tid
  }

  // 模拟同步到后端 Redis
  const syncToBackend = async (cartData) => {
    try {
      const userStore = useUserStore()
      // 注意：后端 CartController 的 syncCart 接收的是 Map<String, Object>
      // 字段名需要与后端匹配：userId, tempUserId, cartItems (JSON string)
      
      const payload = {
        cartItems: JSON.stringify(cartData)
      }
      
      if (userStore.isLoggedIn && userStore.userInfo && userStore.userInfo.id) {
        payload.userId = String(userStore.userInfo.id)
      } else {
        // 如果未登录，使用临时ID
        let tid = localStorage.getItem('temp_user_id')
        if (!tid) {
            tid = 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
            localStorage.setItem('temp_user_id', tid)
        }
        payload.tempUserId = tid
      }
      
      await cartApi.syncCart(payload)
      // console.log('Cart synced to backend successfully')
    } catch (error) {
      console.error('Failed to sync cart to backend', error)
    }
  }

  // 添加商品到购物车
  const addToCart = (product, shop) => {
    const sId = shop.id || shop.shopId || shop.shop_id || 'unknown'
    const existingItem = items.value.find(item => String(item.productId) === String(product.id) && String(item.shopId) === String(sId))
    if (existingItem) {
      existingItem.quantity += 1
    } else {
      items.value.push({
        shopId: sId,
        shopName: shop.name,
        productId: product.id,
        productName: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        checked: true // 默认选中
      })
    }
  }

  // 减少商品数量
  const minusQuantity = (productId, shopId) => {
    const index = items.value.findIndex(item => String(item.productId) === String(productId) && String(item.shopId) === String(shopId))
    if (index !== -1) {
      if (items.value[index].quantity > 1) {
        items.value[index].quantity -= 1
      } else {
        items.value.splice(index, 1) // 数量为0则移除
      }
    }
  }

  // 切换选中状态
  const toggleChecked = (productId, shopId) => {
    const item = items.value.find(item => String(item.productId) === String(productId) && String(item.shopId) === String(shopId))
    if (item) {
      item.checked = !item.checked
    }
  }

  // 获取某个店铺的购物车商品列表
  const getShopCartItems = computed(() => {
    return (shopId) => items.value.filter(item => String(item.shopId) === String(shopId))
  })

  // 获取某个店铺的购物车总数量
  const getShopCartCount = computed(() => {
    return (shopId) => {
      return getShopCartItems.value(shopId).reduce((total, item) => total + item.quantity, 0)
    }
  })

  // 获取某个店铺的购物车总金额（已选中的商品）
  const getShopCartTotal = computed(() => {
    return (shopId) => {
      const selectedItems = getShopCartItems.value(shopId).filter(item => item.checked)
      return selectedItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)
    }
  })

  // 登录后合并购物车数据
  const mergeCartAfterLogin = async () => {
    const userStore = useUserStore()
    // 必须有用户登录才能合并
    if (!userStore.isLoggedIn || !userStore.userInfo || !userStore.userInfo.id) return

    // 获取之前保存的临时ID
    const tempId = localStorage.getItem('temp_user_id')
    
    // 如果没有本地数据，且也没有临时ID，那就只需要拉取云端数据
    if (items.value.length === 0 && !tempId) {
        try {
            const res = await cartApi.getCart({ userId: String(userStore.userInfo.id) })
            // 兼容直接返回 JSON 字符串或对象的情况
            let cloudItems = []
            if (typeof res === 'string') {
                cloudItems = JSON.parse(res)
            } else if (Array.isArray(res)) {
                cloudItems = res
            } else if (res && res.data) {
                // 如果是 { code: 200, data: "..." }
                cloudItems = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
            }
            
            if (Array.isArray(cloudItems)) {
                items.value = cloudItems
            }
        } catch(e) {
            console.error('Fetch cloud cart failed', e)
        }
        return
    }

    try {
      // 1. 获取用户云端原本的购物车数据
      let cloudItems = []
      try {
        const res = await cartApi.getCart({ userId: String(userStore.userInfo.id) })
        if (typeof res === 'string') {
            cloudItems = JSON.parse(res)
        } else if (Array.isArray(res)) {
            cloudItems = res
        }
      } catch(e) {}
      
      // 2. 获取临时用户在云端的数据（如果有临时ID）
      let tempCloudItems = []
      if (tempId) {
          try {
            const res = await cartApi.getCart({ tempUserId: tempId })
            if (typeof res === 'string') {
                tempCloudItems = JSON.parse(res)
            } else if (Array.isArray(res)) {
                tempCloudItems = res
            }
          } catch(e) {}
      }

      // 3. 合并策略：本地 > 临时云端 > 用户云端
      // 我们这里简化：以当前本地 items 为基准（因为它可能已经包含刚才操作的数据），去合并云端的
      // 如果本地为空，则合并 临时云端 + 用户云端
      
      let finalCart = [...cloudItems]
      
      // 合并临时云端数据
      tempCloudItems.forEach(item => {
        const existing = finalCart.find(c => String(c.productId) === String(item.productId))
        if (existing) {
             // 策略：累加数量
             existing.quantity += item.quantity
        } else {
             finalCart.push(item)
        }
      })
      
      // 合并本地数据 (本地数据是最新的操作)
      items.value.forEach(item => {
        const existing = finalCart.find(c => String(c.productId) === String(item.productId))
        if (existing) {
             // 本地覆盖云端？还是累加？通常登录合并时，本地操作优先
             // 这里选择：如果本地有，以本地为准（覆盖），或者累加
             // 简单起见：以本地为准，因为用户刚才可能就在操作
             existing.quantity = item.quantity
        } else {
             finalCart.push(item)
        }
      })
      
      // 4. 更新本地状态，这会自动触发 watch 同步到用户ID对应的 Redis
      items.value = finalCart
      
      // 5. 清理游客的临时ID
      if (tempId) {
          localStorage.removeItem('temp_user_id')
      }

      console.log('Cart merged successfully!')
    } catch (error) {
      console.error('Failed to merge cart', error)
    }
  }

  return {
    items,
    getTempId,
    addToCart,
    minusQuantity,
    toggleChecked,
    getShopCartItems,
    getShopCartCount,
    getShopCartTotal,
    mergeCartAfterLogin
  }
})