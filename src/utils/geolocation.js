/**
 * 地理位置服务
 */
export class GeolocationService {
  /**
   * 获取当前位置
   * @returns {Promise<{longitude: number, latitude: number}>}
   */
  static getCurrentPosition() {
    return new Promise((resolve, reject) => {
      console.log('🗺️ 开始获取地理位置...');
      
      // 检查是否在预览环境中
      const isPreview = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isPreview) {
        console.log('🔧 检测到预览环境，请确保已允许位置权限');
      }
      
      // 定义：浏览器原生定位（作为百度优先失败后的回退）
      const useBrowserGeolocation = () => {
        // 首先尝试使用浏览器原生地理位置API
        if (navigator.geolocation) {
          console.log('🌐 使用浏览器原生地理位置API（作为回退）');
          
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const coords = {
                longitude: position.coords.longitude,
                latitude: position.coords.latitude
              };
              console.log('✅ 浏览器原生定位成功:', coords);
              resolve(coords);
            },
            (error) => {
              console.error('❌ 浏览器原生定位失败:', error.message, 'Code:', error.code);
              if (error.code === 1) {
                console.error('🚫 用户拒绝了位置权限请求');
              } else if (error.code === 2) {
                console.error('📍 位置信息不可用');
              } else if (error.code === 3) {
                console.error('⏰ 获取位置信息超时');
              }
              // 浏览器原生API失败，使用原有百度兜底逻辑
              this.tryBaiduGeolocation(resolve, reject);
            },
            {
              enableHighAccuracy: true,
              timeout: 15000, // 增加超时时间
              maximumAge: 300000 // 5分钟缓存
            }
          );
        } else {
          console.log('🚫 浏览器不支持地理位置API，使用百度兜底逻辑');
          this.tryBaiduGeolocation(resolve, reject);
        }
      };

      // 优先：百度地图API定位（DIRECT 走本地网络，规避 VPN 影响）
      const tryBaiduFirstThenBrowser = () => {
        let readyCheckTimer = null;
        let baiduTried = false;
        const clearReadyTimer = () => {
          if (readyCheckTimer) {
            clearTimeout(readyCheckTimer);
            readyCheckTimer = null;
          }
        };

        const doBaiduLocate = () => {
          if (baiduTried) return;
          baiduTried = true;
          try {
            console.log('🗺️ 优先使用百度地图API进行定位');
            const geolocation = new window.BMap.Geolocation();
            geolocation.getCurrentPosition(
              function(result) {
                console.log('📍 百度优先定位回调执行，状态码:', this.getStatus());
                if (this.getStatus() === 0) {
                  const position = {
                    longitude: result.point.lng,
                    latitude: result.point.lat
                  };
                  console.log('✅ 百度定位成功(优先):', position);
                  clearReadyTimer();
                  resolve(position);
                } else {
                  console.warn('⚠️ 百度优先定位失败，状态码:', this.getStatus(), '→ 切换到浏览器原生定位');
                  clearReadyTimer();
                  useBrowserGeolocation();
                }
              },
              function(error) {
                console.warn('⚠️ 百度优先定位错误 → 切换到浏览器原生定位:', error);
                clearReadyTimer();
                useBrowserGeolocation();
              },
              {
                enableHighAccuracy: true,
                timeout: 8000, // 百度优先尝试：缩短等待时间，尽快回退
                maximumAge: 0
              }
            );
          } catch (e) {
            console.warn('⚠️ 百度优先定位异常 → 切换到浏览器原生定位:', e);
            clearReadyTimer();
            useBrowserGeolocation();
          }
        };

        // 如果 BMap 已经就绪，直接定位；否则短暂等待（最多 1s）
        if (window.BMap && window.BMap.Geolocation) {
          doBaiduLocate();
        } else {
          const start = Date.now();
          const waitBMapReady = () => {
            if (window.BMap && window.BMap.Geolocation) {
              doBaiduLocate();
              return;
            }
            if (Date.now() - start > 2000) {
              console.warn('⏳ 百度API未就绪（2s超时）→ 先使用浏览器原生定位');
              clearReadyTimer();
              useBrowserGeolocation();
              return;
            }
            readyCheckTimer = setTimeout(waitBMapReady, 100);
          };
          waitBMapReady();
        }
      };

      // 执行百度优先策略
      tryBaiduFirstThenBrowser();
    });
  }
  
  /**
   * 尝试使用百度地图API获取位置
   */
  static tryBaiduGeolocation(resolve, reject) {
    console.log('🗺️ 尝试使用百度地图API...');
    
    let checkInterval;
    let isResolved = false;
    
    // 等待百度地图API加载完成
    const checkBMapReady = () => {
      console.log('🔍 检查百度地图API加载状态:', !!window.BMap);
      
      if (!window.BMap) {
        if (!isResolved) {
          checkInterval = setTimeout(checkBMapReady, 100); // 每100ms检查一次
        }
        return;
      }
      
      // 清理定时器
      if (checkInterval) {
        clearTimeout(checkInterval);
        checkInterval = null;
      }
      
      console.log('✅ 百度地图API已加载，开始获取位置');
      
      // 百度地图API已加载，开始获取位置
      const geolocation = new window.BMap.Geolocation();
    
      geolocation.getCurrentPosition(
        function(result) {
          console.log('📍 百度定位回调执行，状态码:', this.getStatus());
          console.log('📍 百度定位结果:', result);
          
          if (this.getStatus() === 0) { // BMAP_STATUS_SUCCESS = 0
            const position = {
              longitude: result.point.lng,
              latitude: result.point.lat
            };
            console.log('✅ 百度定位成功:', position);
            isResolved = true;
            if (checkInterval) clearTimeout(checkInterval);
            clearTimeout(timeout);
            resolve(position);
          } else {
            const errorMsg = `百度定位失败，状态码：${this.getStatus()}`;
            console.error('❌ 百度定位失败:', errorMsg, '使用默认位置（上海）');
            isResolved = true;
            if (checkInterval) clearTimeout(checkInterval);
            clearTimeout(timeout);
            const defaultPosition = {
              longitude: 121.4737,
              latitude: 31.2304
            };
            console.log('📍 使用默认位置:', defaultPosition);
            resolve(defaultPosition);
          }
        },
        function(error) {
          console.error('❌ 百度定位错误回调:', error, '使用默认位置（上海）');
          isResolved = true;
          if (checkInterval) clearTimeout(checkInterval);
          clearTimeout(timeout);
          const defaultPosition = {
            longitude: 121.4737,
            latitude: 31.2304
          };
          console.log('📍 使用默认位置:', defaultPosition);
          resolve(defaultPosition);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    };
    
    // 设置超时机制，10秒后如果还没加载就使用默认位置
    const timeout = setTimeout(() => {
      console.error('⏰ 百度地图API加载超时，使用默认位置（上海）');
      isResolved = true;
      if (checkInterval) clearTimeout(checkInterval);
      const defaultPosition = {
        longitude: 121.4737,
        latitude: 31.2304
      };
      console.log('📍 使用默认位置:', defaultPosition);
      resolve(defaultPosition);
    }, 10000);
    
    // 开始检查百度地图API
    checkBMapReady();
  }

  /**
   * 计算距离显示文本
   * @param {number} distance 距离（米）
   * @returns {string}
   */
  static formatDistance(distance) {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(1)} km`;
    }
    return `${distance} m`;
  }
}