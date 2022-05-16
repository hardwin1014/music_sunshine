<template>
  <div
    class="player"
    v-show="playlist.length"
  >
    <transition
      name="normal"
      @enter="enter"
      @after-enter="afterEnter"
      @leave="leave"
      @after-leave="afterLeave"
    >
      <div
        class="normal-player"
        v-show="fullScreen"
      >
        <!--fullScreen 控制播放器全屏展开还是全屏收缩  currentSong  vuex计算属性中-->
        <div class="background">
          <img :src="currentSong.pic">
        </div>
        <div class="top">
          <div
            class="back"
            @click="goBack"
          >
            <i class="icon-back"></i>
          </div>
          <h1 class="title">{{currentSong.name}}</h1>
          <h2 class="subtitle">{{currentSong.singer}}</h2>
        </div>
        <div
          class="middle"
          @touchstart.prevent="onMiddleTouchStart"
          @touchmove.prevent="onMiddleTouchMove"
          @touchend.prevent="onMiddleTouchEnd"
        >
          <div
            class="middle-l"
            :style="middleLStyle"
          >
            <div
              ref="cdWrapperRef"
              class="cd-wrapper"
            >
              <div
                ref="cdRef"
                class="cd"
              >
                <img
                  ref="cdImageRef"
                  class="image"
                  :class="cdCls"
                  :src="currentSong.pic">
              </div>
            </div>
            <div class="playing-lyric-wrapper">
              <div class="playing-lyric">{{playingLyric}}</div>
            </div>
          </div>
          <scroll
            class="middle-r"
            ref="lyricScrollRef"
            :style="middleRStyle"
          >
            <div class="lyric-wrapper">
              <div v-if="currentLyric" ref="lyricListRef">
                <p
                  class="text"
                  :class="{'current': currentLineNum ===index}"
                  v-for="(line,index) in currentLyric.lines"
                  :key="line.num"
                >
                  {{line.txt}}
                </p>
              </div>
              <div class="pure-music" v-show="pureMusicLyric">
                <p>{{pureMusicLyric}}</p>
              </div>
            </div>
          </scroll>
        </div>
        <div class="bottom">
          <div class="dot-wrapper">
            <span class="dot" :class="{'active':currentShow==='cd'}"></span>
            <span class="dot" :class="{'active':currentShow==='lyric'}"></span>
          </div>
          <div class="progress-wrapper">
            <span class="time time-l">{{formatTime(currentTime)}}</span>
            <div class="progress-bar-wrapper">
              <progress-bar
                ref="barRef"
                :progress="progress"
                @progress-changing="onProgressChanging"
                @progress-changed="onProgressChanged"
              ></progress-bar>
            </div>
            <span class="time time-r">{{formatTime(currentSong.duration)}}</span>
          </div>
          <!--几种播放状态-->
          <div class="operators">
            <div class="icon i-left">
              <i @click="changeMode" :class="modeIcon"></i>
            </div>
            <div class="icon i-left" :class="disableCls">
              <i @click="prev" class="icon-prev"></i>
            </div>
            <div class="icon i-center" :class="disableCls">
              <i @click="togglePlay" :class="playIcon"></i>
            </div>
            <div class="icon i-right" :class="disableCls">
              <i @click="next" class="icon-next"></i>
            </div>
            <div class="icon i-right">
              <i @click="toggleFavorite(currentSong)" :class="getFavoriteIcon(currentSong)"></i>
            </div>
          </div>
        </div>
      </div>
    </transition>
    <mini-player
      :progress="progress"
      :toggle-play="togglePlay"
    ></mini-player>
    <!--控制歌曲的播放 pause 暂停事件（意外暂停）  canplay有一段缓冲数据可以播放的时候，触发-->
    <audio
      ref="audioRef"
      @pause="pause"
      @canplay="ready"
      @error="error"
      @timeupdate="updateTime"
      @ended="end"
    ></audio>
  </div>
</template>

<script>
  import { useStore } from 'vuex'
  import { computed, watch, ref, nextTick } from 'vue'
  import useMode from './use-mode'
  import useFavorite from './use-favorite'
  import useCd from './use-cd'
  import useLyric from './use-lyric'
  import useMiddleInteractive from './use-middle-interactive'
  import useAnimation from './use-animation'
  import usePlayHistory from './use-play-history'
  import ProgressBar from './progress-bar'
  import Scroll from '@/components/base/scroll/scroll'
  import MiniPlayer from './mini-player'
  import { formatTime } from '@/assets/js/util'
  import { PLAY_MODE } from '@/assets/js/constant'

  export default {
    name: 'player',
    components: {
      MiniPlayer,
      ProgressBar,
      Scroll
    },
    // 把不同的逻辑放在不同的文件中，把相同的逻辑放在文件中管理
    setup() {
      // data
      const audioRef = ref(null)
      const barRef = ref(null)
      const songReady = ref(false)// 判断歌曲是否准备好，为了快速点击播放切歌，不会引起DOM报错
      const currentTime = ref(0)
      let progressChanging = false

      // vuex
      const store = useStore()
      // 利用计算属性,把数据处理成响应式的
      const fullScreen = computed(() => store.state.fullScreen)
      const currentSong = computed(() => store.getters.currentSong)
      const playing = computed(() => store.state.playing)
      const currentIndex = computed(() => store.state.currentIndex)
      const playMode = computed(() => store.state.playMode)

      // hooks
      const { modeIcon, changeMode } = useMode()
      const { getFavoriteIcon, toggleFavorite } = useFavorite()
      const { cdCls, cdRef, cdImageRef } = useCd()
      const { currentLyric, currentLineNum, pureMusicLyric, playingLyric, lyricScrollRef, lyricListRef, playLyric, stopLyric } = useLyric({
        songReady,
        currentTime
      })
      const { currentShow, middleLStyle, middleRStyle, onMiddleTouchStart, onMiddleTouchMove, onMiddleTouchEnd } = useMiddleInteractive()
      const { cdWrapperRef, enter, afterEnter, leave, afterLeave } = useAnimation()
      const { savePlay } = usePlayHistory()

      // computed
      const playlist = computed(() => store.state.playlist)

      const playIcon = computed(() => {
        // 动态设置 播放  暂停  两种状态
        return playing.value ? 'icon-pause' : 'icon-play'
      })

      const progress = computed(() => {
        return currentTime.value / currentSong.value.duration
      })

      // 如果是ready的情况，不会有任何样式，如果没有，给一个disableclas样式
      const disableCls = computed(() => {
        return songReady.value ? '' : 'disable'
      })

      // watch 监听currentSong的变化拿到新的歌曲URL
      watch(currentSong, (newSong) => {
        if (!newSong.id || !newSong.url) {
          return
        }
        currentTime.value = 0
        // 当我的歌曲发生变化的时候,设为FALSE
        songReady.value = false
        // 拿到dom，将URL赋值给标签  播放
        const audioEl = audioRef.value
        audioEl.src = newSong.url
        audioEl.play()
        store.commit('setPlayingState', true)
      })

      // 播放和播放状态发生关联,监听paying
      watch(playing, (newPlaying) => {
        // 如果songReady为FALSE，什么都不要做
        if (!songReady.value) {
          return
        }
        const audioEl = audioRef.value
        // 如果播放状态，就调用audio的播放方法，暂停就调用audio的暂停方法
        if (newPlaying) {
          audioEl.play()
          playLyric()
        } else {
          audioEl.pause()
          stopLyric()
        }
      })

      watch(fullScreen, async (newFullScreen) => {
        if (newFullScreen) {
          await nextTick()
          barRef.value.setOffset(progress.value)
        }
      })

      // methods
      function goBack() {
        // 收缩
        store.commit('setFullScreen', false)
      }

      // 控制播放状态
      function togglePlay() {
        // 没有songReady的时候，就不让前进和后退
        if (!songReady.value) {
          return
        }
        // 修改全局的状态，取反
        store.commit('setPlayingState', !playing.value)
      }

      function pause() {
        store.commit('setPlayingState', false)
      }

      // 后退，获取全局的currentIndex的索引，让其减一
      function prev() {
        const list = playlist.value
        // 如果没有数据，那就啥也不做， // 没有songReady的时候，就不让前进和后退
        if (!songReady.value || !list.length) {
          return
        }

        // 如果此时只有一首歌，那么久循环播放
        if (list.length === 1) {
          loop()
        } else {
          let index = currentIndex.value - 1
          // 如果是-1，那么代表在第1首歌的位置，此时后退就是最后一位
          if (index === -1) {
            index = list.length - 1
          }
          store.commit('setCurrentIndex', index)
        }
      }

      // 前进，获取全局的currentIndex的索引，让其加一
      function next() {
        const list = playlist.value
        if (!songReady.value || !list.length) {
          return
        }

        // 如果此时只有一首歌，那么久循环播放
        if (list.length === 1) {
          loop()
        } else {
          let index = currentIndex.value + 1
          // 如果在末尾再前进，那么就要回退到第一首歌
          if (index === list.length) {
            index = 0
          }
          store.commit('setCurrentIndex', index)
        }
      }

      // 循环播放当前歌曲
      function loop() {
        const audioEl = audioRef.value
        audioEl.currentTime = 0// 循环播放的时候，点击上一首或下一首，直接把播放时间设为0，重新播放
        audioEl.play()
        store.commit('setPlayingState', true)
      }

      function ready() {
        // 如果你已经是ready了那么就不要操作了
        if (songReady.value) {
          return
        }
        // j暂停了将数据同步
        songReady.value = true
        playLyric()
        savePlay(currentSong.value)
      }

      // 如果出错的情况，也允许切歌
      function error() {
        songReady.value = true
      }

      function updateTime(e) {
        if (!progressChanging) {
          currentTime.value = e.target.currentTime
        }
      }

      function onProgressChanging(progress) {
        progressChanging = true
        currentTime.value = currentSong.value.duration * progress
        playLyric()
        stopLyric()
      }

      function onProgressChanged(progress) {
        progressChanging = false
        audioRef.value.currentTime = currentTime.value = currentSong.value.duration * progress
        if (!playing.value) {
          store.commit('setPlayingState', true)
        }
        playLyric()
      }

      function end() {
        currentTime.value = 0
        if (playMode.value === PLAY_MODE.loop) {
          loop()
        } else {
          next()
        }
      }

      return {
        audioRef,
        barRef,
        fullScreen,
        currentTime,
        currentSong,
        playlist,
        playIcon,
        disableCls,
        progress,
        goBack,
        togglePlay,
        pause,
        prev,
        next,
        ready,
        error,
        updateTime,
        formatTime,
        onProgressChanging,
        onProgressChanged,
        end,
        // mode
        modeIcon,
        changeMode,
        // favorite
        getFavoriteIcon,
        toggleFavorite,
        // cd
        cdCls,
        cdRef,
        cdImageRef,
        // lyric
        currentLyric,
        currentLineNum,
        pureMusicLyric,
        playingLyric,
        lyricScrollRef,
        lyricListRef,
        // middle-interactive
        currentShow,
        middleLStyle,
        middleRStyle,
        onMiddleTouchStart,
        onMiddleTouchMove,
        onMiddleTouchEnd,
        // animation
        cdWrapperRef,
        enter,
        afterEnter,
        leave,
        afterLeave
      }
    }
  }
</script>

<style lang="scss" scoped>
  .player {
    // 全屏显示
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
        }
        .icon-back {
          display: block;
          padding: 9px;
          font-size: $font-size-large-x;
          color: $color-theme;
          transform: rotate(-90deg);
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
        white-space: nowrap;
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
                animation: rotate 20s linear infinite
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
            text-align: left
          }
          .icon-favorite {
            color: $color-sub-theme;
          }
        }
      }
      &.normal-enter-active, &.normal-leave-active {
        transition: all .6s;
        .top, .bottom {
          transition: all .6s cubic-bezier(0.45, 0, 0.55, 1);
        }
      }
      &.normal-enter-from, &.normal-leave-to {
        opacity: 0;
        .top {
          transform: translate3d(0, -100px, 0);
        }
        .bottom {
          transform: translate3d(0, 100px, 0)
        }
      }
    }
  }
</style>
