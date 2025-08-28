import { createApp } from 'vue'

// 按需引入Vant组件
import {
  Button,
  Cell,
  CellGroup,
  Field,
  Form,
  NavBar,
  Tabbar,
  TabbarItem,
  Toast,
  Dialog,
  Loading,
  PullRefresh,
  List,
  Image as VanImage,
  Swipe,
  SwipeItem,
  Grid,
  GridItem,
  Search,
  Tag,
  Rate,
  Popup
} from 'vant'

// 引入样式
import 'vant/lib/index.css'

const components = [
  Button,
  Cell,
  CellGroup,
  Field,
  Form,
  NavBar,
  Tabbar,
  TabbarItem,
  Toast,
  Dialog,
  Loading,
  PullRefresh,
  List,
  VanImage,
  Swipe,
  SwipeItem,
  Grid,
  GridItem,
  Search,
  Tag,
  Rate,
  Popup
]

export default {
  install(app) {
    components.forEach(component => {
      app.use(component)
    })
  }
}