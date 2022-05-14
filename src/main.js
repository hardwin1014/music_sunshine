import { createApp } from 'vue'
import lazyPlugin from 'vue3-lazy'
// 全局引入注册loading
import loadingDirective from '@/components/base/loading/directive'
import noResultDirective from '@/components/base/no-result/directive'
import App from './App.vue'
import router from './router'
import store from './store'
// 引入全局样式文件
import '@/assets/scss/index.scss'

createApp(App)
  .use(store)
  .use(router)
  .use(lazyPlugin, {
    loading: require('@/assets/images/default.png'),
    error: 'error.png'
  })
  .directive('loading', loadingDirective)
  .directive('no-result', noResultDirective)
  .mount('#app')
