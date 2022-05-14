import BScroll from '@better-scroll/core'
import ObserveDOM from '@better-scroll/observe-dom' // 监听dom变化
import { onMounted, onUnmounted, onActivated, onDeactivated, ref } from 'vue'

BScroll.use(ObserveDOM)

export default function useScroll(wrapperRef, options, emit) {
  const scroll = ref(null)

  onMounted(() => {
    // wrapperRef.value传入dom
    const scrollVal = scroll.value = new BScroll(wrapperRef.value, {
      observeDOM: true, // 监听dom
      ...options
    })

    // 在这里判断probeType
    if (options.probeType > 0) {
      scrollVal.on('scroll', (pos) => {
        // 派发一个事件，把位置信息派发出去
        emit('scroll', pos)
      })
    }
  })

  onUnmounted(() => {
    scroll.value.destroy()
  })

  onActivated(() => {
    scroll.value.enable()
    scroll.value.refresh()
  })

  onDeactivated(() => {
    scroll.value.disable()
  })

  return scroll
}
