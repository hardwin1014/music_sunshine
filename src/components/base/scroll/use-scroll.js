import BScroll from '@better-scroll/core'
import ObserveDOM from '@better-scroll/observe-dom'
import { onActivated, onDeactivated, onMounted, onUnmounted, ref } from 'vue'

BScroll.use(ObserveDOM)

export default function useScroll(wrapperRef, options, emit) {
  const scroll = ref(null)
  onMounted(() => {
    /** BScroll 判断能不能滚动 new 的时候 此时会做计算
     *  debugger 的时候scroll 标签里面的内容是没有的，所以就不满足滚动条件，就不能滚动
     * 解决： 利用 observe-dom 当 DOM 元素发生变化时去自动调用 refresh 方法
     */
    const scrollVal = (scroll.value = new BScroll(wrapperRef.value, {
      observeDOM: true,
      scrollX: true,
      ...options
    }))

    // 根据传入的probeType来控制 滚动的监听强度 来节约资源
    if (options.probeType > 0) {
      scrollVal.on('scroll', (pos) => {
        emit('scroll', pos)
      })
    }
  })
  onUnmounted(() => {
    scroll.value.destroy()
  })
  // 被包含在中的组件，会多出两个生命周期钩子函数。被激活时执行。
  onActivated(() => {
    scroll.value.enable()
    scroll.value.refresh()
  })
  // 比如从 A 组件，切换到 B 组件，A 组件消失时执行。
  onDeactivated(() => {
    scroll.value.disable()
  })
  return scroll
}
