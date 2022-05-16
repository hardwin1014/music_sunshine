import { createApp } from 'vue'
import { addClass, removeClass } from '@/assets/js/dom'

const relativeCls = 'g-relative' // 定义样式

// 把loading组件动态插入到页面dom中
// 传入loading组件
export default function createLoadingLikeDirective(Comp) {
  return {
    mounted(el, binding) {
      // vue 是可以多实例的
      const app = createApp(Comp) // loading 组件
      // 挂载的地方是动态创建的div上，因为创建这个元素没有挂载到body上，所以没有实质性DOM上挂载
      // 要挂载到el上
      const instance = app.mount(document.createElement('div'))
      const { name } = Comp
      // el可以存储多个了, 通过name
      if (!el[name]) {
        el[name] = {} // 解决多指令数据覆盖的情况
      }
      // 保存起来 方便多次使用
      el[name].instance = instance
      const title = binding.arg // 动态参数
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
      // 组件更新后进行判断, 当 前后值不一样时
      if (binding.value !== binding.oldValue) {
        // 判断binging.value的值 TRUE FALSE 执行添加 或 移除 操作
        binding.value ? append(el) : remove(el)
      }
    }
  }

  function append(el) {
    // el.instance.$el  loading 组件的DOM对象
    /** 还存在一些问题 ：：
     * loading 组件要求 外层容器的定位是 'absolute', 'fixed', 'relative'
     * 动态添加
     */
    const { name } = Comp
    const style = getComputedStyle(el) // getComputedStyle 用于获取指定元素的css
    if (['absolute', 'fixed', 'relative'].indexOf(style.position) === -1) {
      addClass(el, relativeCls)
    }
    // el[name].instance是loading组件实例，.el是对应的dom上
    // 挂载到loading组件实例的dom上
    el.appendChild(el[name].instance.$el)
  }

  function remove(el) {
    const { name } = Comp
    removeClass(el, relativeCls)
    //  移除dom
    el.removeChild(el[name].instance.$el)
  }
}
