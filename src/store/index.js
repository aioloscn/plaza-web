import { createPinia } from 'pinia'

const pinia = createPinia()

export default pinia

// 导出所有store模块
export { useUserStore } from './modules/user'
export { useAppStore } from './modules/app'