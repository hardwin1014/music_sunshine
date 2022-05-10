import { computed, nextTick, ref, watch } from 'vue'

export default function useFixed(props) {
  const groupRef = ref(null)
  const listHeights = ref([])
  const scrollY = ref(0)
  const currentIndex = ref(0) // 当前渲染组的索引
  const distance = ref(0)
  const TITLE_HEIGHT = 30

  const fixedTitle = computed(() => {
    if (scrollY.value < 0) {
      return ''
    }
    const currentGroup = props.data[currentIndex.value]
    return currentGroup ? currentGroup.title : ''
  })

  const fixedStyle = computed(() => {
    const distanceVal = distance.value
    const diff = distanceVal > 0 && distanceVal < TITLE_HEIGHT ? distanceVal - TITLE_HEIGHT : 0
    return {
      transform: `translate3d(0,${diff}px,0)`
    }
  })

  watch(
    () => props.data,
    async () => {
      /**
       * 这样写还是存在问题
       * 当数据发生变化之后，这个回调函数内部的DOM还是没有发生变化的
       * DOM发生变化是在nextTick 之后
       */
      // nextTick(() => {
      //     calculate()
      // })
      await nextTick()
      calculate()
    }
  )

  watch(scrollY, (newY) => {
    const listHeightsVal = listHeights.value
    for (let i = 0; i < listHeightsVal.length - 1; i++) {
      const heightTop = listHeightsVal[i]
      const heightBottom = listHeightsVal[i + 1]
      // 此时落在区间上
      // newY >= 0 && newT <= 760
      if (newY >= heightTop && newY <= heightBottom) {
        currentIndex.value = i
        distance.value = heightBottom - newY
      }
    }
  })
  /**
   * 计算
   * 什么情况的时候去计算，当数据变化时，DOM就会发生变化，也就是DOM变化后要去计算
   */
  function calculate() {
    const list = groupRef.value.children
    const listHeightsVal = listHeights.value
    let height = 0
    listHeightsVal.length = 0
    listHeightsVal.push(height)
    for (let i = 0; i < list.length; i++) {
      // 每个元素对应的DOM
      /**
       * 这里为什么要累加? 因为滚动的一个值 就列表的高度 从0到最大滚动高度就一个不断递增的值
       * 所以区间也要这样记录，方便对应它们的关系
       */
      height += list[i].clientHeight
      listHeightsVal.push(height)
    }
  }

  function onScroll(pos) {
    // 这里scroll 往下滑动时反馈的值是一个负值
    scrollY.value = -pos.y
  }
  return { groupRef, onScroll, fixedTitle, fixedStyle, currentIndex }
}
