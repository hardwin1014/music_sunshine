import { createApp } from 'vue'
import { addClass, removeClass } from '@/assets/js/dom'

const relativeCls = 'g-relative'

export default function createLoadingLikeDirective(Comp) {
  return {
    mounted(el, binding) {
      // vue 是可以多实例的
      const app = createApp(Comp) // loading 组件
      // DOM 对象
      const instance = app.mount(document.createElement('div'))
      const { name } = Comp
      if (!el[name]) {
        el[name] = {} // 解决多指令数据覆盖的情况
      }
      // 保存起来 方便多次使用
      el[name].instance = instance
      const title = binding.arg
      if (typeof title !== 'undefined') {
        el[name].instance.setTitle(title)
      }
      if (binding.value) {
        append(el)
      }
    },
    updated(el, binding) {
      const { name } = Comp
      const title = binding.arg
      if (typeof title !== 'undefined') {
        el[name].instance.setTitle(title)
      }
      // 当 前后值不一样时
      if (binding.value !== binding.oldValue) {
        // 执行添加 或 移除 操作
        binding.value ? append(el) : remove(el)
      }
    }
  }

  function append(el) {
    // el.instance.$el  loading 组件的DOM对象
    /** 还存在一些问题 ：：
     * loading 组件要求 外层容器的定位是 'absolute', 'fixed', 'relative'
     */
    const { name } = Comp
    const style = getComputedStyle(el) // getComputedStyle 用于获取指定元素的css
    if (['absolute', 'fixed', 'relative'].indexOf(style.position) === -1) {
      addClass(el, relativeCls)
    }
    el.appendChild(el[name].instance.$el)
  }

  function remove(el) {
    const { name } = Comp
    removeClass(el, relativeCls)
    el.removeChild(el[name].instance.$el)
  }
}
