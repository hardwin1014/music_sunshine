import { computed, ref } from 'vue'

export default function useShortcut(props, groupRef) {
  const scrollRef = ref(null)
  const ANCHOR_HEIGHT = 18
  const touch = {} // 记录坐标
  const shortcutList = computed(() => {
    return props.data.map((group) => {
      return group.title
    })
  })
  function onShortcutTouchStart(e) {
    const anchorIndex = parseInt(e.target.dataset.index) // 索引
    touch.y1 = e.touches[0].pageY
    touch.anchorIndex = anchorIndex
    scrollTo(anchorIndex)
  }
  function onShortcutTouchMove(e) {
    // 记录touchstart、touchmove的纵坐标
    touch.y2 = e.touches[0].pageY
    console.log(touch)
    const delta = ((touch.y2 - touch.y1) / ANCHOR_HEIGHT) | 0 // 差值 | 0 意思是整数向下取整的简写法
    const anchorIndex = touch.anchorIndex + delta
    scrollTo(anchorIndex)
  }

  function scrollTo(index) {
    if (isNaN(index)) {
      return
    }
    index = Math.max(0, Math.min(shortcutList.value.length - 1, index))
    const targetEl = groupRef.value.children[index] // 通过索引拿到对应组的DOM
    const { scroll } = scrollRef.value
    scroll.scrollToElement(targetEl, 500) // 调用betterScroll 的 scrollToElement 方法
  }
  return { shortcutList, onShortcutTouchStart, scrollRef, onShortcutTouchMove }
}
