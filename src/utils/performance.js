// 性能监控工具
export class PerformanceMonitor {
  constructor() {
    this.metrics = {}
    this.observers = []
  }

  // 监控页面加载性能
  measurePageLoad() {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0]
      
      this.metrics.pageLoad = {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        request: navigation.responseStart - navigation.requestStart,
        response: navigation.responseEnd - navigation.responseStart,
        dom: navigation.domContentLoadedEventEnd - navigation.responseEnd,
        load: navigation.loadEventEnd - navigation.loadEventStart,
        total: navigation.loadEventEnd - navigation.navigationStart
      }
    }
  }

  // 监控首屏渲染时间
  measureFCP() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime
          }
        })
      })
      
      observer.observe({ entryTypes: ['paint'] })
      this.observers.push(observer)
    }
  }

  // 监控最大内容绘制时间
  measureLCP() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.metrics.lcp = lastEntry.startTime
      })
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.push(observer)
    }
  }

  // 监控累积布局偏移
  measureCLS() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      let clsValue = 0
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            this.metrics.cls = clsValue
          }
        })
      })
      
      observer.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(observer)
    }
  }

  // 监控首次输入延迟
  measureFID() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          this.metrics.fid = entry.processingStart - entry.startTime
        })
      })
      
      observer.observe({ entryTypes: ['first-input'] })
      this.observers.push(observer)
    }
  }

  // 获取所有性能指标
  getMetrics() {
    return this.metrics
  }

  // 清理观察器
  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }

  // 上报性能数据
  report() {
    if (process.env.NODE_ENV === 'production') {
      // 这里可以集成第三方性能监控服务
      console.log('Performance Metrics:', this.metrics)
    }
  }
}

// 创建全局实例
export const performanceMonitor = new PerformanceMonitor()

// 自动开始监控
if (typeof window !== 'undefined') {
  performanceMonitor.measurePageLoad()
  performanceMonitor.measureFCP()
  performanceMonitor.measureLCP()
  performanceMonitor.measureCLS()
  performanceMonitor.measureFID()
  
  // 页面卸载时上报数据
  window.addEventListener('beforeunload', () => {
    performanceMonitor.report()
    performanceMonitor.cleanup()
  })
}