import {
  computed,
  nextTick,
  onActivated,
  onDeactivated,
  onMounted,
  onUnmounted,
  ref,
  watch
} from 'vue'
import { useStore } from 'vuex'
import BScroll from '@better-scroll/core'
import Slide from '@better-scroll/slide'

BScroll.use(Slide)
export default function useMiniSlider() {
  const sliderWrapperRef = ref(null)
  const slider = ref(null)

  const store = useStore()
  const fullScreen = computed(() => store.state.fullScreen)
  const playlist = computed(() => store.state.playlist)
  const currentIndex = computed(() => store.state.currentIndex)
  const sliderShow = computed(() => {
    return !fullScreen.value && !!playlist.value // !! 强制转换为布尔类型
  })

  onMounted(() => {
    let sliderVal
    watch(sliderShow, async (newSliderShow) => {
      if (newSliderShow) {
        await nextTick() // 等待DOM渲染完 如果没有DOM数据 那么 new BScroll 没有意义
        if (!sliderVal) {
          // 只执行一次
          sliderVal = slider.value = new BScroll(sliderWrapperRef.value, {
            click: true, // 配置意思参照官网
            scrollX: true,
            scrollY: false,
            momentum: false,
            bounce: false,
            probeType: 2,
            slide: {
              autoplay: false, // 禁止自动播放
              loop: true
            }
          })
          // 触发时机：当 slide 切换 page 之后触发
          sliderVal.on('slidePageChanged', ({ pageX }) => {
            console.log('slidePageChanged')
            store.commit('setCurrentIndex', pageX)
            // store.commit('setPlayingState', true)
          })
        } else {
          sliderVal.refresh()
        }
        // 滚动到对应的歌曲
        sliderVal.goToPage(currentIndex.value, 0, 0)
      }
    })
    watch(currentIndex, async (newIndex) => {
      if (sliderVal && sliderShow.value) {
        await nextTick()
        sliderVal.goToPage(newIndex, 0, 0)
      }
    })
    /**
     * 在playlist 展开或者隐藏的时候呢，那个 refresh() 是没有发生变化的，
     * 所以这里要多加一个逻辑去watch playlist 的变化， 因为歌曲发生变化了本质上是playlist的变化
     */
    watch(playlist, async (newList) => {
      // 当 playlist 发生变化的时候，可能 sliderVal 不存在
      // 当 newList.length 不存在的时候也要去判断
      if (sliderVal && sliderShow.value && newList.length) {
        await nextTick()
        sliderVal.refresh()
      }
    })
  })
  onUnmounted(() => {
    if (slider.value) {
      slider.value.destroy()
    }
  })
  onActivated(() => {
    slider.value.enable()
    slider.value.refresh()
  })

  onDeactivated(() => {
    slider.value.disable()
  })
  return { slider, sliderWrapperRef }
}
