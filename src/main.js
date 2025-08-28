import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// 引入Vant组件库
import vantPlugin from './plugins/vant'

// 引入全局样式
import './assets/styles/index.scss'

// 创建应用实例
const app = createApp(App)

// 使用插件
app.use(createPinia())
app.use(router)
app.use(vantPlugin)

// 挂载应用
app.mount('#app')