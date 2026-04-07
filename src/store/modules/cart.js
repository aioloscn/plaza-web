import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cartApi } from '@/api'
import { useUserStore } from './user'

export const useCartStore = defineStore('cart', () => {
  // 从云端获取的购物车数据
  const items = ref([])

  // 重新从服务器获取购物车列表
  const fetchCartList = async () => {
    try {
      const res = await cartApi.getCartList()
      // res 现在是 CartListVO，包含 items 和 totalPrice
      if (res && res.items) {
        items.value = res.items
      } else {
        items.value = []
      }
    } catch (error) {
      console.error('Fetch cart list failed', error)
    }
  }

  // 添加商品到购物车
  const addToCart = async (product, shop) => {
    try {
      const sId = shop.id || shop.shopId || shop.shop_id
      await cartApi.addCart({
        productId: product.id,
        shopId: sId,
        count: 1
      })
      await fetchCartList()
    } catch (error) {
      console.error('Add to cart failed', error)
    }
  }

  // 减少商品数量
  const minusQuantity = async (cartItemId) => {
    const item = items.value.find(item => String(item.id) === String(cartItemId))
    if (item) {
      try {
        if (item.quantity > 1) {
          await cartApi.updateQuantity({
            cartItemId: item.id,
            count: item.quantity - 1
          })
        } else {
          await cartApi.deleteCartItem(item.id)
        }
        await fetchCartList()
      } catch (error) {
        console.error('Minus quantity failed', error)
      }
    }
  }

  // 设置商品数量
  const setQuantity = async (cartItemId, count) => {
    try {
      if (count > 0) {
        await cartApi.updateQuantity({
          cartItemId,
          count: count
        })
      } else {
        await cartApi.deleteCartItem(cartItemId)
      }
      await fetchCartList()
    } catch (error) {
      console.error('Set quantity failed', error)
    }
  }

  // 删除商品
  const deleteItem = async (cartItemId) => {
    try {
      await cartApi.deleteCartItem(cartItemId)
      await fetchCartList()
    } catch (error) {
      console.error('Delete item failed', error)
    }
  }

  // 设置选中状态
  const checkCartItem = async (data) => {
    try {
      await cartApi.checkCartItem(data)
    } catch (error) {
      console.error('Check cart item failed', error)
      throw error
    }
  }

  // 切换选中状态
  const toggleChecked = async (cartItemId) => {
    const item = items.value.find(item => String(item.id) === String(cartItemId))
    if (item) {
      try {
        await cartApi.checkCartItem({
          cartItemIds: [item.id],
          checked: item.checked ? 0 : 1
        })
        await fetchCartList()
      } catch (error) {
        console.error('Toggle checked failed', error)
      }
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
    if (!userStore.isLoggedIn) return

    try {
      await cartApi.mergeCart()
      await fetchCartList()
      console.log('Cart merged successfully!')
    } catch (error) {
      console.error('Failed to merge cart', error)
    }
  }

  return {
    items,
    fetchCartList,
    addToCart,
    minusQuantity,
    setQuantity,
    deleteItem,
    checkCartItem,
    toggleChecked,
    getShopCartItems,
    getShopCartCount,
    getShopCartTotal,
    mergeCartAfterLogin
  }
})
