import { ref, watch, computed, nextTick } from 'vue'

export default function useFixed(props) {
  const TITLE_HEIGHT = 30 // 组标题栏的高度
  const groupRef = ref(null)
  const listHeights = ref([]) // 定义高度区间
  const scrollY = ref(0)
  const currentIndex = ref(0) // 当前渲染展示索引
  const distance = ref(0)// 当前组的下一个组距离顶部的的值

  // 固定标题
  const fixedTitle = computed(() => {
    if (scrollY.value < 0) {
      return ''
    }
    const currentGroup = props.data[currentIndex.value]
    // 如果存在，那就把当前区间的title换掉
    return currentGroup ? currentGroup.title : ''
  })

  // 上一个组标题，被挤上去的动画
  const fixedStyle = computed(() => {
    const distanceVal = distance.value
    // 判断是否到顶和距离顶部是否有30px,这时候两个标题组正好挨着,此时传入区间高度减去30的模块高度,并改变css
    const diff = (distanceVal > 0 && distanceVal < TITLE_HEIGHT) ? distanceVal - TITLE_HEIGHT : 0
    return {
      transform: `translate3d(0,${diff}px,0)`
    }
  })

  // 监听数据的变化
  watch(() => props.data, async () => {
    // 等页面更新之后，可以正确获取高度
    await nextTick()
    // 当数据变化的时候，进行计算
    calculate()
  })

  // 判断在那个区间内，传入当前位置
  watch(scrollY, (newY) => {
    // 当前组的位置
    const listHeightsVal = listHeights.value
    for (let i = 0; i < listHeightsVal.length - 1; i++) {
      // 取区间的顶部和底部
      const heightTop = listHeightsVal[i]
      const heightBottom = listHeightsVal[i + 1] // 下一组
      // 看当前坐标是否在区间内
      if (newY >= heightTop && newY <= heightBottom) {
        // 如果在，把当前位置取走
        currentIndex.value = i
        // 当前组的下一组距离顶部的距离
        distance.value = heightBottom - newY
      }
    }
  })

  // 求列表的高度
  function calculate() {
    // 拿到ul的dom
    const list = groupRef.value.children
    const listHeightsVal = listHeights.value
    let height = 0

    // 清空数组
    listHeightsVal.length = 0
    listHeightsVal.push(height)

    for (let i = 0; i < list.length; i++) {
      height += list[i].clientHeight // 滚动就是一个不断递增的值
      listHeightsVal.push(height)
    }
  }

  function onScroll(pos) {
    // 可以拿到纵轴的坐标情况, 因为这个坐标是从0到负的值，所以要转正
    scrollY.value = -pos.y
  }

  return {
    groupRef,
    onScroll,
    fixedTitle,
    fixedStyle,
    currentIndex
  }
}
