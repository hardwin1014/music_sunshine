import { ref } from 'vue'
import animations from 'create-keyframe-animation'

export default function useAnimation() {
  const cdWrapperRef = ref(null)
  // 这里不用响应式，因为不需要关心它们的变化，只是标志位
  let entering = false
  let leaving = false
  function enter(el, done) {
    if (leaving) {
      afterLeave()
    }
    entering = true
    // el 对应的DOM
    // done: 通过js去做动画，vue内部是不知道什么时候动画结束的，所以需要你来告诉它
    const { x, y, scale } = getPosAndScale()
    const animation = {
      0: {
        // -147.5 407 0.1333333...
        transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`
      },
      100: {
        transform: 'translate3d(0, 0, 0) scale(1)'
      }
    }
    // 注册动画
    animations.registerAnimation({
      name: 'move',
      animation,
      presets: {
        duration: 600, // 时长
        easing: 'cubic-bezier(0.45, 0, 0.55, 1)' // 缓动效果
      }
    })
    /**
     * 参数： DOM 、动画名称
     * 调用 done 说明结束了 进入 afterEnter
     */
    animations.runAnimation(cdWrapperRef.value, 'move', done)
  }
  function afterEnter() {
    entering = false
    // 清理操作
    animations.unregisterAnimation('move')
    cdWrapperRef.value.animation = ''
  }
  function leave(el, done) {
    // 如果 entering 还是为true 就手动触发 afterEnter()
    if (entering) {
      afterEnter()
    }
    leaving = true
    const { x, y, scale } = getPosAndScale()
    const cdWrapperEl = cdWrapperRef.value
    cdWrapperEl.style.transition = 'all .6s cubic-bezier(0.45, 0, 0.55, 1)'
    cdWrapperEl.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
    cdWrapperEl.addEventListener('transitionend', next) // 触发 transition 结束事件

    function next() {
      // 解绑 其实vue 内部也会有这样的逻辑，也就是为什么vue 会知道动画什么时候结束，也是调用了这些API
      // 所以要经常考虑如果绑定了一个事件，那么什么时候解绑掉 如果不解绑有可能导致内存泄漏
      cdWrapperEl.removeEventListener('transitionend', next)
      done() // 告诉vue已经结束动画
    }
  }
  function afterLeave() {
    leaving = false
    const cdWrapperEl = cdWrapperRef.value
    cdWrapperEl.style.transition = ''
    cdWrapperEl.style.transform = ''
  }
  function getPosAndScale() {
    const targetWidth = 40
    const paddingLeft = 40 // min CD 的 r 20 + 距离左边的距离 20 = 40
    const paddingBottom = 30
    const paddingTop = 80 // 大 CD 距离顶部距离
    const width = window.innerWidth * 0.8 // 大 CD 的宽度 屏幕宽度的百分之80
    const x = -(window.innerWidth / 2 - paddingLeft) // x 偏移量 往左偏移是负值
    // 667 - 80 - 300 / 2 - 30
    const y = window.innerHeight - paddingTop - width / 2 - paddingBottom
    const scale = targetWidth / width
    console.log(x, y, scale)
    return { x, y, scale }
  }
  return { enter, afterEnter, leave, afterLeave, cdWrapperRef }
}
