// 开发环境下使用 createLogger 插件 查看提交状态
import { createStore, createLogger } from 'vuex'
import mutations from './mutations'
import state from './state'
import * as getters from './getters'
import * as actions from './actions'

const debug = process.env.NODE_ENV !== 'production' // 开发环境
export default createStore({
  state,
  mutations,
  getters,
  actions,
  /*
  严格模式：当去检测state修改是不是在提交mutations的时候, 就会深度watch state,
          当state有任何变化，就会检测是不是在提交mutations，如果不是的话就会报警告，
          当人这个严格模式会有性能消耗，因为深度watch了，所以在开发环境开启
   */
  strict: debug,
  plugins: debug ? [createLogger()] : []
})
