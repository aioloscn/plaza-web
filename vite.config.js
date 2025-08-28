import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import pxToViewport from 'postcss-px-to-viewport'

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
      '@store': resolve(__dirname, 'src/store')
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
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://live.aiolos.com:8700',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
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