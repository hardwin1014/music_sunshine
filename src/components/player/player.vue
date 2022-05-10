<template>
  <div class="player" v-show="playlist.length">
    <transition
      name="normal"
      @enter="enter"
      @after-enter="afterEnter"
      @leave="leave"
      @after-leave="afterLeave"
    >
      <div class="normal-player" v-show="fullScreen">
        <div class="background">
          <img :src="currentSong.pic" />
        </div>
        <div class="top">
          <div class="back" @click="goBack">
            <i class="icon-back"></i>
          </div>
          <h1 class="title">{{ currentSong.name }}</h1>
          <h2 class="subtitle">{{ currentSong.singer }}</h2>
        </div>
        <div
          class="middle"
          @touchstart.prevent="onMiddleTouchStart"
          @touchmove.prevent="onMiddleTouchMove"
          @touchend.prevent="onMiddleTouchEnd"
        >
          <div class="middle-l" :style="middleLStyle">
            <div ref="cdWrapperRef" class="cd-wrapper">
              <div class="cd" ref="cdRef">
                <img class="image" :class="cdCls" ref="cdImageRef" :src="currentSong.pic" />
              </div>
            </div>
            <div class="playing-lyric-wrapper">
              <div class="playing-lyric">{{ playingLyric }}</div>
            </div>
          </div>
          <scroll class="middle-r" :style="middleRStyle" ref="lyricScrollRef">
            <div class="lyric-wrapper">
              <div v-if="currentLyric" ref="lyricListRef">
                <p
                  class="text"
                  :class="{ current: currentLineNum === index }"
                  v-for="(line, index) in currentLyric.lines"
                  :key="line.num"
                >
                  {{ line.txt }}
                </p>
              </div>
              <div class="pure-music" v-show="pureMusicLyric">
                <p>{{ pureMusicLyric }}</p>
              </div>
            </div>
          </scroll>
        </div>
        <div class="bottom">
          <div class="dot-wrapper">
            <span class="dot" :class="{ active: currentShow === 'cd' }"></span>
            <span class="dot" :class="{ active: currentShow === 'lyric' }"></span>
          </div>
          <div class="progress-wrapper">
            <div class="time time-l">{{ formatTime(currentTime) }}</div>
            <div class="progress-bar-wrapper">
              <progress-bar
                ref="barRef"
                :progress="progress"
                @progress-changing="onProgressChanging"
                @progress-changed="onProgressChanged"
              ></progress-bar>
            </div>
            <div class="time time-r">
              {{ formatTime(currentSong.duration) }}
            </div>
          </div>
          <div class="operators">
            <div class="icon i-left">
              <i @click="changeMode" :class="modeIcon"></i>
            </div>
            <div class="icon i-left" :class="disableCls">
              <i class="icon-prev" @click="prev"></i>
            </div>
            <div class="icon i-center" :class="disableCls">
              <i :class="playIcon" @click="togglePlay"></i>
            </div>
            <div class="icon i-right" :class="disableCls">
              <i class="icon-next" @click="next"></i>
            </div>
            <div class="icon i-right">
              <i :class="getFavoriteIcon(currentSong)" @click="toggleFavorite(currentSong)"></i>
            </div>
          </div>
        </div>
      </div>
    </transition>
    <mini-player :progress="progress" :toggle-play="togglePlay"></mini-player>
    <audio
      ref="audioRef"
      @pause="pause"
      @canplay="ready"
      @error="error"
      @ended="end"
      @timeupdate="updateTime"
    ></audio>
  </div>
</template>

<script>
import Scroll from '@/components/base/scroll/scroll'
import { computed, nextTick, ref, watch } from '@vue/runtime-core'
import { useStore } from 'vuex'
import { formatTime } from '@/assets/js/util'
import { PLAY_MODE } from '@/assets/js/constant'
import useMode from './use-mode'
import useFavorite from './use-favorite'
import useCd from './use-cd'
import useLyric from './use-lyric'
import usePlayHistory from './use-play-history'
import useMiddleInteractive from './use-middle-interactive'
import useAnimation from './use-animation'
import ProgressBar from './progress-bar'
import MiniPlayer from './mini-player'

export default {
  components: {
    ProgressBar,
    Scroll,
    MiniPlayer
  },
  setup() {
    // data
    const audioRef = ref(null)
    const barRef = ref(null)
    const songReady = ref(false)
    const currentTime = ref(0)
    let progressChanging = false
    // vuex
    // computed 响应式 这里的东西一旦变化 数据立马改变
    const store = useStore()
    const currentSong = computed(() => store.getters.currentSong)
    const playlist = computed(() => store.state.playlist)
    const fullScreen = computed(() => store.state.fullScreen)
    const playing = computed(() => store.state.playing)
    const currentIndex = computed(() => store.state.currentIndex)
    const playMode = computed(() => store.state.playMode)
    const progress = computed(() => {
      return currentTime.value / currentSong.value.duration
    })
    // hooks
    const { modeIcon, changeMode } = useMode()
    const { getFavoriteIcon, toggleFavorite } = useFavorite()
    const { cdCls, cdRef, cdImageRef } = useCd()
    const {
      currentLyric,
      currentLineNum,
      playLyric,
      lyricScrollRef,
      lyricListRef,
      stopLyric,
      pureMusicLyric,
      playingLyric
    } = useLyric({ songReady, currentTime })
    const {
      currentShow,
      middleLStyle,
      middleRStyle,
      onMiddleTouchStart,
      onMiddleTouchMove,
      onMiddleTouchEnd
    } = useMiddleInteractive()
    const { enter, afterEnter, cdWrapperRef, leave, afterLeave } = useAnimation()
    const { savePlay } = usePlayHistory()
    // computed
    const disableCls = computed(() => {
      return songReady.value ? '' : 'disable'
    })
    const playIcon = computed(() => {
      return playing.value ? 'icon-pause' : 'icon-play'
    })

    // watch
    watch(currentSong, (newSong) => {
      if (!newSong.id || !newSong.url) {
        return
      }
      /**
       * 当切换歌曲的时候将 songReady 置为 false
       * 然后再去执行 audioEl.play()，然后歌曲去进行缓存，触发canplay事件，然后执行ready函数 将songReady 置为 true
       */
      currentTime.value = 0 // 当歌曲变化时 置为0
      songReady.value = false
      const audioEl = audioRef.value
      audioEl.src = newSong.url
      audioEl.play()
      store.commit('setPlayingState', true)
    })
    watch(playing, (newPlaying) => {
      // 当 songReady 还是false 的时候什么都不做 解决播放报错问题
      if (!songReady.value) {
        return
      }
      const audioEl = audioRef.value
      if (newPlaying) {
        audioEl.play()
        playLyric()
      } else {
        audioEl.pause()
        // 因为当歌曲暂停时，歌词还没有暂停，这里要同时暂停歌词 做到同步
        stopLyric()
      }
    })
    watch(fullScreen, async (newFullScreen) => {
      if (newFullScreen) {
        await nextTick() // 等待DOM 渲染完毕
        barRef.value.setOffset(progress.value)
      }
    })
    // methods
    function goBack() {
      store.commit('setFullScreen', false)
    }
    function togglePlay() {
      if (!songReady.value) {
        return
      }
      store.commit('setPlayingState', !playing.value)
    }
    function prev() {
      const list = playlist.value
      if (!songReady.value || !list.length) {
        // 没有任何歌曲
        return
      }
      // 当列表只有一首歌的时候 循环播放
      if (list.length === 1) {
        loop()
      } else {
        let index = currentIndex.value - 1
        if (index === -1) {
          // 如果是第一页跳转到最后一页
          index = list.length - 1
        }
        store.commit('setCurrentIndex', index)
        // if (!playing.value) {
        //   store.commit('setPlayingState', true)
        // }
      }
    }
    function next() {
      const list = playlist.value
      if (!songReady.value || !list.length) {
        // 没有任何歌曲
        return
      }
      let index = currentIndex.value + 1
      if (list.length === 1) {
        loop()
      } else {
        if (index === list.length) {
          // 如果是第一页跳转到最后一页
          index = 0
        }
        store.commit('setCurrentIndex', index)
        // if (!playing.value) {
        //   store.commit('setPlayingState', true)
        // }
      }
    }
    function loop() {
      const audioEl = audioRef.value
      audioEl.currentTime = 0
      audioEl.play()
      store.commit('setPlayingState', true)
    }
    function ready() {
      // 会多次缓存数据所以会多次执行 ready, 如果已经是true 直接返回
      if (songReady.value) {
        return
      }
      songReady.value = true
      // 当 songReady 为 true 时去播放歌词
      playLyric()
      savePlay(currentSong.value)
    }
    function error() {
      // 这里的作用是，如果是error 的状态，歌曲是可以前进和后退的
      songReady.value = true
    }
    function end() {
      currentTime.value = 0
      if (playMode.value === PLAY_MODE.loop) {
        loop()
      } else {
        next()
      }
    }
    function updateTime(e) {
      if (!progressChanging) {
        currentTime.value = e.target.currentTime
      }
    }
    function onProgressChanging(progress) {
      progressChanging = true
      currentTime.value = currentSong.value.duration * progress
      // 正在拖动的过程中 先play 同步到当前的位置 再stop 因为changing的时候是不需要变化的
      playLyric()
      stopLyric()
    }
    function onProgressChanged(progress) {
      progressChanging = false
      // 当收松开 再去修改audio的时间
      audioRef.value.currentTime = currentTime.value = currentSong.value.duration * progress
      // 如果当时歌曲是暂停的让它播放
      if (!playing.value) {
        store.commit('setPlayingState', true)
      }
      // 当 拖动结束时 播放歌词
      playLyric()
    }
    /** 防止电脑待机状态等时候，playing 还是 true的状态 */
    function pause() {
      store.commit('setPlayingState', false)
    }
    return {
      currentSong,
      playlist,
      fullScreen,
      audioRef,
      currentTime,
      progress,
      barRef,
      goBack,
      playIcon,
      togglePlay,
      pause,
      prev,
      next,
      ready,
      updateTime,
      formatTime,
      disableCls,
      error,
      end,
      onProgressChanging,
      onProgressChanged,
      // mode
      modeIcon,
      changeMode,
      // favorite
      toggleFavorite,
      getFavoriteIcon,
      // useCd
      cdCls,
      cdRef,
      cdImageRef,
      // lyric
      currentLyric,
      currentLineNum,
      playLyric,
      lyricScrollRef,
      lyricListRef,
      pureMusicLyric,
      playingLyric,
      // useMiddleInteractive
      currentShow,
      middleLStyle,
      middleRStyle,
      onMiddleTouchStart,
      onMiddleTouchMove,
      onMiddleTouchEnd,
      // useAnimation
      enter,
      afterEnter,
      cdWrapperRef,
      leave,
      afterLeave
    }
  }
}
</script>

<style lang="scss" scoped>
.player {
  .normal-player {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 150;
    background: $color-background;
    .background {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      opacity: 0.6;
      filter: blur(20px);
      img {
        width: 100%;
        height: 100%;
      }
    }
    .top {
      position: relative;
      margin-bottom: 25px;
      .back {
        position: absolute;
        top: 0;
        left: 6px;
        z-index: 50;
        .icon-back {
          display: block;
          padding: 9px;
          font-size: $font-size-large-x;
          color: $color-theme;
          transform: rotate(-90deg);
        }
      }
      .title {
        width: 70%;
        margin: 0 auto;
        line-height: 40px;
        text-align: center;
        @include no-wrap();
        font-size: $font-size-large;
        color: $color-text;
      }
      .subtitle {
        line-height: 20px;
        text-align: center;
        font-size: $font-size-medium;
        color: $color-text;
      }
    }
    .middle {
      position: fixed;
      width: 100%;
      top: 80px;
      bottom: 170px;
      white-space: nowrap; // white-space CSS 属性是用来设置如何处理元素中的 空白
      font-size: 0;
      .middle-l {
        display: inline-block;
        vertical-align: top;
        position: relative;
        width: 100%;
        height: 0;
        padding-top: 80%;
        .cd-wrapper {
          position: absolute;
          left: 10%;
          top: 0;
          width: 80%;
          box-sizing: border-box;
          height: 100%;
          // -147.5 407 0.1333333...
          // transform: translate3d(-147px, 407px, 0) scale(0.133333);
          .cd {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            img {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
              box-sizing: border-box;
              border-radius: 50%;
              border: 10px solid rgba(255, 255, 255, 0.1);
            }
            .playing {
              animation: rotate 20s linear infinite;
            }
          }
        }
        .playing-lyric-wrapper {
          width: 80%;
          margin: 30px auto 0 auto;
          overflow: hidden;
          text-align: center;
          .playing-lyric {
            height: 20px;
            line-height: 20px;
            font-size: $font-size-medium;
            color: $color-text-l;
          }
        }
      }
      .middle-r {
        display: inline-block;
        vertical-align: top;
        width: 100%;
        height: 100%;
        overflow: hidden;
        box-sizing: border-box;
        .lyric-wrapper {
          width: 80%;
          margin: 0 auto;
          overflow: hidden;
          text-align: center;
          .text {
            line-height: 32px;
            color: $color-text-l;
            font-size: $font-size-medium;
            &.current {
              color: $color-text;
            }
          }
          .pure-music {
            padding-top: 50%;
            line-height: 32px;
            color: $color-text-l;
            font-size: $font-size-medium;
          }
        }
      }
    }
    .bottom {
      position: absolute;
      bottom: 50px;
      width: 100%;
      .dot-wrapper {
        text-align: center;
        font-size: 0;
        .dot {
          display: inline-block;
          vertical-align: middle;
          margin: 0 4px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: $color-text-l;
          &.active {
            width: 20px;
            border-radius: 5px;
            background: $color-text-ll;
          }
        }
      }
      .progress-wrapper {
        display: flex;
        align-items: center;
        width: 80%;
        margin: 0px auto;
        padding: 10px 0;
        .time {
          color: $color-text;
          font-size: $font-size-small;
          flex: 0 0 40px;
          line-height: 30px;
          width: 40px;
          &.time-l {
            text-align: left;
          }
          &.time-r {
            text-align: right;
          }
        }
        .progress-bar-wrapper {
          flex: 1;
        }
      }
      .operators {
        display: flex;
        align-items: center;
        .icon {
          flex: 1;
          color: $color-theme;
          &.disable {
            color: $color-theme-d;
          }
          i {
            font-size: 30px;
          }
        }
        .i-left {
          text-align: right;
        }
        .i-center {
          padding: 0 20px;
          text-align: center;
          i {
            font-size: 40px;
          }
        }
        .i-right {
          text-align: left;
        }
        .icon-favorite {
          color: $color-sub-theme;
        }
      }
    }
    &.normal-enter-active,
    &.normal-leave-active {
      transition: all 0.6s;
      .top,
      .bottom {
        transition: all 0.6s cubic-bezier(0.45, 0, 0.55, 1);
      }
    }
    &.normal-enter-from,
    &.normal-leave-to {
      opacity: 0;
      .top {
        transform: translate3d(0, -100px, 0);
      }
      .bottom {
        transform: translate3d(0, 100px, 0);
      }
    }
  }
}
</style>
