# 商家搜索功能说明

## 功能概述

本次更新完善了商家搜索功能，新增了 `/shop/search` 接口的完整集成。

## 主要改进

### 1. API 接口完善

**文件**: `src/api/modules/shop.js`
- 完善了 `searchShops` 方法
- 支持关键词搜索 (`keyword`)
- 支持地理位置参数 (`longitude`, `latitude`)
- 支持分页参数 (`page`, `pageSize`)

```javascript
searchShops({ keyword, longitude, latitude, page = 1, pageSize = 10 })
```

**文件**: `src/api/modules/search.js`
- 新增了 `searchShops` 方法，与 shop 模块保持一致
- 统一了搜索相关的 API 接口

### 2. 搜索页面功能增强

**文件**: `src/views/Search/index.vue`
- 集成真实的 API 调用，替换了模拟数据
- 添加了地理位置获取功能
- 支持分页加载
- 优化了数据格式化逻辑
- 添加了错误处理机制

### 3. 地理位置集成

- 使用 `GeolocationService` 获取用户真实位置
- 支持位置权限处理
- 提供默认位置兜底方案（北京：116.404, 39.915）

## 接口参数说明

### `/plaza-home/shop/search` 接口参数

**请求方式**: POST  
**请求格式**: JSON (与 `/plaza-home/shop/recommend` 接口格式保持一致)

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| keyword | string | 是 | 搜索关键词 |
| longitude | number | 是 | 用户经度 |
| latitude | number | 是 | 用户纬度 |
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认10 |

**请求示例**:
```json
{
  "page": {
    "current": 1,
    "size": 10
  },
  "data": {
    "keyword": "火锅",
    "longitude": 116.404,
    "latitude": 39.915
  }
}
```

### 响应数据格式

期望的响应格式：
```javascript
{
  data: {
    list: [
      {
        id: "商家ID",
        name: "商家名称",
        description: "商家描述",
        image: "商家图片URL",
        price: "平均价格",
        distance: "距离（米）"
      }
    ],
    hasMore: true // 是否还有更多数据
  }
}
```

## 数据字段映射

为了兼容不同的数据格式，搜索结果会进行字段映射：

- **商家名称**: `name` || `shopName` || `title` || '未知店铺'
- **商家描述**: `description` || `desc` || '暂无描述'
- **商家图片**: `image` || `avatar` || `logo` || '/images/shop-default.svg'
- **平均价格**: `price` || `avgPrice` || 0
- **距离**: `distance` (米转换为公里，保留1位小数)

## 使用方式

1. 用户在搜索页面输入关键词
2. 系统自动获取用户地理位置
3. 调用 `/shop/search` 接口进行搜索
4. 展示搜索结果，支持下拉加载更多
5. 点击商家可跳转到商家详情页

## 注意事项

1. 需要用户授权地理位置权限
2. 如果获取位置失败，会使用北京作为默认位置
3. 搜索结果支持无限滚动加载
4. 搜索历史会自动保存到本地存储

## 调试信息

在开发环境中，搜索API的响应会在控制台输出，便于调试：
```javascript
console.log('搜索API响应:', response)
```