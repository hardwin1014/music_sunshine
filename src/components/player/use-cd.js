import { useStore } from 'vuex'
import { computed, ref, watch } from 'vue'

export default function useCd() {
  // data
  const cdRef = ref(null)
  const cdImageRef = ref(null)

  // vuex
  const store = useStore()
  const playing = computed(() => store.state.playing)
  const cdCls = computed(() => {
    return playing.value ? 'playing' : ''
  })

  watch(playing, (newPlaying) => {
    if (!newPlaying) {
      console.log(newPlaying)
      syncTransform(cdRef.value, cdImageRef.value)
    }
  })

  function syncTransform(wrapper, inner) {
    // 外层同步内层
    const wrapperTransform = getComputedStyle(wrapper).transform
    const innerTransform = getComputedStyle(inner).transform
    wrapper.style.transform =
      wrapperTransform === 'none' ? innerTransform : innerTransform.concat(' ', wrapperTransform)
  }
  return { cdCls, cdRef, cdImageRef }
}
