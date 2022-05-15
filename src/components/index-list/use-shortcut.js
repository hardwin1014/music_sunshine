import { ref, computed } from 'vue'

export default function useShortcut(props, groupRef) {
  const ANCHOR_HEIGHT = 18
  const scrollRef = ref(null)

  // 组名数组
  const shortcutList = computed(() => {
    // 数据是数组中的标题
    return props.data.map((group) => {
      return group.title
    })
  })

  const touch = {}

  // 点击组名，跳转至对应的组
  function onShortcutTouchStart(e) {
    // console.log(e.target.dataset.index) // ul下面的li
    // li上绑定了data-index，使用dom api拿到,拿到当前位置
    const anchorIndex = parseInt(e.target.dataset.index)
    touch.y1 = e.touches[0].pageY // 拿到移动时的初始坐标
    touch.anchorIndex = anchorIndex // 存储开始的时候的索引
    // 传入点击li的index值
    scrollTo(anchorIndex)
  }

  //
  function onShortcutTouchMove(e) {
    touch.y2 = e.touches[0].pageY// 拿到第二个坐标
    // 手指长按A-Z框开始位置和手指停止位置,相减  除以锚点字母高度，得到偏移量就是
    const delta = (touch.y2 - touch.y1) / ANCHOR_HEIGHT | 0 // | 0 向下取整
    const anchorIndex = touch.anchorIndex + delta // 开始的时候的索引 + 偏移量 = 锚点位置
    scrollTo(anchorIndex)
  }

  // 滚动到目标位置
  function scrollTo(index) {
    // 对拖动在黑边，index为NAN,做限制
    if (isNaN(index)) {
      return
    }
    // 对index限制在表长度之间，不然，滑动到外部，最大位置会列报错
    index = Math.max(0, Math.min(shortcutList.value.length - 1, index))
    const targetEl = groupRef.value.children[index] // 拿到子元素位置
    const scroll = scrollRef.value.scroll// 拿到scroll组件的BetterScroll的事件方法
    // console.log(targetEl)
    // BetterScroll api https://better-scroll.github.io/docs/zh-CN/guide/base-scroll-api.html#%E6%96%B9%E6%B3%95
    // 滚动到指定的目标元素
    scroll.scrollToElement(targetEl, 0)
  }

  return {
    shortcutList,
    scrollRef,
    onShortcutTouchStart,
    onShortcutTouchMove
  }
}
