import { computed, ref, watch } from 'vue'
import { useStore } from 'vuex'
import Lyric from 'lyric-parser'
import { getLyric } from '../../service/song'

export default function useLyric({ songReady, currentTime }) {
  const currentLyric = ref(null)
  const currentLineNum = ref(0)
  const lyricScrollRef = ref(null)
  const lyricListRef = ref(null)
  const playingLyric = ref('')
  const pureMusicLyric = ref('')
  const store = useStore()
  const currentSong = computed(() => store.getters.currentSong)
  watch(currentSong, async (newSong) => {
    if (!newSong.url || !newSong.id) {
      return
    }
    /** 这三行代码解决歌词来回跳动的问题 */
    // 处理边界问题
    stopLyric()
    currentLyric.value = null
    currentLineNum.value = 0
    pureMusicLyric.value = ''
    const lyric = await getLyric(newSong)
    store.commit('addSongLyric', {
      song: newSong,
      lyric
    })
    /**
     * 注意 getLyric 是个异步的过程是有网络延迟的，如果一首歌曲，比如说a切换到b这个时候 b在 getLyric过程中
     * 又从b切到了c, 那么之前b getLyric 返回的逻辑都不用执行了，所以需要做一个判断
     */
    if (currentSong.value.lyric !== lyric) {
      return
    }
    /** 这里虽然实例化了 但是没有播放 什么时候播放呢，可以在实例化后播放
     * 但是这里判断，注意这里有两个异步过程 currentSong变化 和 歌曲播放的canplay 触发的 ready 也是一个异步过程
     * 所以要判断 songReady 是否为 true ，为true时证明已经开始播放这时去触发实例播放才有意思
     */
    currentLyric.value = new Lyric(lyric, handleLyric)
    const hasLyric = currentLyric.value.lines.length
    if (hasLyric) {
      if (songReady.value) {
        playLyric()
      }
    } else {
      playingLyric.value = pureMusicLyric.value = lyric.replace(/\[(\d{2}):(\d{2}):(\d{2})\]/g, '') // 这里的作用是 截取掉[00:00:00]
    }
  })
  /** 歌曲滚动 */
  function playLyric() {
    const currentLyricVal = currentLyric.value
    if (currentLyricVal) {
      currentLyricVal.seek(currentTime.value * 1000)
    }
  }
  /** 停止歌曲滚动 */
  function stopLyric() {
    const currentLyricVal = currentLyric.value
    if (currentLyricVal) {
      currentLyricVal.stop()
    }
  }

  /** 当歌词切换过程中触发 */
  function handleLyric({ lineNum, txt }) {
    // console.log(lineNum)
    // lineNum 当前行号
    currentLineNum.value = lineNum
    // 当前播放的文案
    playingLyric.value = txt
    // 因为 lyricListRef 是组件实例所以 加上 Comp
    const scrollComp = lyricScrollRef.value
    // DOM 实例 加上 El
    const listEl = lyricListRef.value
    // 如果没有这个列表就 return
    if (!listEl) {
      return
    }
    if (lineNum > 5) {
      // 保持歌词居中的位置
      const lineEl = listEl.children[lineNum - 5]
      // console.log(lineEl)
      scrollComp.scroll.scrollToElement(lineEl, 1000)
    } else {
      scrollComp.scroll.scrollTo(0, 0, 1000)
    }
  }

  return {
    currentLyric,
    currentLineNum,
    playLyric,
    lyricScrollRef,
    lyricListRef,
    stopLyric,
    pureMusicLyric,
    playingLyric
  }
}
