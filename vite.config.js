import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import pxToViewport from 'postcss-px-to-viewport'

const defaultAuthSdkPath = resolve(__dirname, 'src/shared/auth-sdk')

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@views': resolve(__dirname, 'src/views'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@api': resolve(__dirname, 'src/api'),
      '@store': resolve(__dirname, 'src/store'),
      '@auth-sdk': defaultAuthSdkPath
    }
  },
  css: {
    postcss: {
      plugins: [
        pxToViewport({
          viewportWidth: 375,
          viewportHeight: 667,
          unitPrecision: 3,
          viewportUnit: 'vw',
          selectorBlackList: ['.ignore', '.van-'],
          minPixelValue: 1,
          mediaQuery: false
        })
      ]
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/assets/styles/base/variables.scss";`
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    // 使用自定义本地域名打开开发站点，便于联调 OAuth/Cookie 等依赖域名的场景
    open: 'http://plaza.aiolos.com',
    allowedHosts: true,
    fs: { allow: [resolve(__dirname)] },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8700',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        cookieDomainRewrite: 'plaza.aiolos.com'
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: '[ext]/[name]-[hash].[ext]',
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          vant: ['vant'],
          utils: ['axios', 'dayjs', 'lodash-es']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'vant', 'axios', 'dayjs']
  }
})
