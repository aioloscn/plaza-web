import dayjs from 'dayjs'

// 格式化时间
export const formatTime = (time, format = 'YYYY-MM-DD HH:mm:ss') => {
  return dayjs(time).format(format)
}

// 格式化相对时间
export const formatRelativeTime = (time) => {
  const now = dayjs()
  const target = dayjs(time)
  const diff = now.diff(target, 'minute')
  
  if (diff < 1) {
    return '刚刚'
  } else if (diff < 60) {
    return `${diff}分钟前`
  } else if (diff < 1440) {
    return `${Math.floor(diff / 60)}小时前`
  } else {
    return target.format('MM-DD HH:mm')
  }
}

// 格式化价格
export const formatPrice = (price) => {
  return `¥${Number(price).toFixed(2)}`
}

// 格式化距离
export const formatDistance = (distance) => {
  if (distance < 1000) {
    return `${distance}m`
  } else {
    return `${(distance / 1000).toFixed(1)}km`
  }
}