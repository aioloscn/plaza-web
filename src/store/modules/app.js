import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 应用状态
  const loading = ref(false)
  const currentCity = ref('北京')
  const searchHistory = ref([])
  
  // 设置加载状态
  const setLoading = (status) => {
    loading.value = status
  }
  
  // 设置当前城市
  const setCurrentCity = (city) => {
    currentCity.value = city
  }
  
  // 添加搜索历史
  const addSearchHistory = (keyword) => {
    if (!keyword || searchHistory.value.includes(keyword)) return
    
    searchHistory.value.unshift(keyword)
    if (searchHistory.value.length > 10) {
      searchHistory.value = searchHistory.value.slice(0, 10)
    }
  }
  
  // 清空搜索历史
  const clearSearchHistory = () => {
    searchHistory.value = []
  }
  
  return {
    loading,
    currentCity,
    searchHistory,
    setLoading,
    setCurrentCity,
    addSearchHistory,
    clearSearchHistory
  }
})