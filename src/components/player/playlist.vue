<template>
  <!-- 该组件渲染到body上 合适于全屏类的 有弹层类的组件 -->
  <teleport to="body">
    <transition name="list-fade">
      <div class="playlist" v-show="visible && playlist.length" @click="hide">
        <div class="list-wrapper">
          <div class="list-header">
            <h1 class="title">
              <i class="icon" :class="modeIcon" @click.stop="changeMode"> </i>
              <span class="text">{{ modeText }}</span>
              <span class="clear" @click="showConfirm">
                <i class="icon-clear"></i>
              </span>
            </h1>
          </div>
          <scroll ref="scrollRef" class="list-content" @click.stop>
            <transition-group ref="listRef" name="list" tag="ul">
              <li
                class="item"
                v-for="song in sequenceList"
                :key="song.id"
                @click="selectItem(song)"
              >
                <i class="current" :class="getCurrentIcon(song)"></i>
                <span class="text">{{ song.name }}</span>
                <span class="favorite" @click="toggleFavorite(song)">
                  <i :class="getFavoriteIcon(song)"></i>
                </span>
                <span class="delete" @click.stop="removeSong(song)" :class="{ disable: removing }">
                  <i class="icon-delete"></i>
                </span>
              </li>
            </transition-group>
          </scroll>
          <div class="list-add">
            <div class="add" @click="showAddSong">
              <i class="icon-add"></i>
              <span class="text">添加歌曲到队列</span>
            </div>
          </div>
          <div class="list-footer" @click="hide">
            <span>关闭</span>
          </div>
        </div>
        <confirm
          ref="confirmRef"
          text="是否清空播放列表？"
          confirm-btn-text="清空"
          @confirm="confirmClear"
        ></confirm>
        <add-song ref="addSongRef"></add-song>
      </div>
    </transition>
  </teleport>
</template>

<script>
import Scroll from '@/components/base/scroll/scroll'
import Confirm from '@/components/base/confirm/confirm'
import addSong from '@/components/add-song/add-song'
import { ref } from '@vue/reactivity'
import { useStore } from 'vuex'
import { computed, nextTick, watch } from '@vue/runtime-core'
import useMode from './use-mode'
import useFavorite from './use-favorite'

export default {
  components: {
    Scroll,
    Confirm,
    addSong
  },
  setup() {
    // data
    const scrollRef = ref(null)
    const listRef = ref(null)
    const addSongRef = ref(null)
    const visible = ref(false)
    const removing = ref(false)
    const confirmRef = ref(false)
    const store = useStore()
    // computed
    const currentSong = computed(() => store.getters.currentSong)
    const playlist = computed(() => store.state.playlist)
    const sequenceList = computed(() => store.state.sequenceList)
    // watch
    watch(currentSong, async (newSong) => {
      /** currentSong 变化有可能 playlist 是没有显示的 */
      if (!visible.value || !newSong.id) {
        return
      }
      // currentSong 发生变化时候，为了保证 scroll 没有问题
      await nextTick()
      scrollToCurrent()
    })
    // hoots
    const { modeIcon, changeMode, modeText } = useMode()
    const { getFavoriteIcon, toggleFavorite } = useFavorite()
    // methods
    async function show() {
      visible.value = true

      await nextTick()
      /**
       * 这里要深度记住，vue的数据驱动，但是DOM的变化有个nextTick,
       * 这个时候才能拿到渲染好的DOM
       */
      refreshScroll() // 这里依赖DOM 所以要等待 DOM 渲染完毕 才能计算
      scrollToCurrent()
    }

    function hide() {
      visible.value = false
    }
    function showConfirm() {
      confirmRef.value.show()
    }
    function scrollToCurrent() {
      const index = sequenceList.value.findIndex((song) => {
        return currentSong.value.id === song.id
      })
      if (index === -1) {
        return
      }
      // const target = listRef.value.children[index]
      const target = listRef.value.$el.children[index]
      scrollRef.value.scroll.scrollToElement(target, 300)
    }
    function showAddSong() {
      addSongRef.value.show()
    }
    function getCurrentIcon(song) {
      if (song.id === currentSong.value.id) {
        return 'icon-play'
      }
    }

    function refreshScroll() {
      // 重新计算
      scrollRef.value.scroll.refresh()
    }

    function selectItem(song) {
      const index = playlist.value.findIndex((item) => {
        return song.id === item.id
      })
      store.commit('setCurrentIndex', index)
      store.commit('setPlayingState', true)
    }

    function removeSong(song) {
      if (removing.value) {
        return
      }
      removing.value = true
      store.dispatch('removeSong', song)
      if (!playlist.value.length) {
        hide()
      }
      setTimeout(() => {
        removing.value = false
      }, 600)
    }

    function confirmClear() {
      store.dispatch('clearSongList')
      hide()
    }

    return {
      // data
      visible,
      scrollRef,
      listRef,
      removing,
      confirmRef,
      addSongRef,
      // computed
      playlist,
      sequenceList,
      currentSong,
      // methods
      show,
      hide,
      refreshScroll,
      getCurrentIcon,
      showAddSong,
      selectItem,
      removeSong,
      confirmClear,
      showConfirm,
      // useMode
      modeIcon,
      changeMode,
      modeText,
      // useFavorite
      getFavoriteIcon,
      toggleFavorite
    }
  }
}
</script>

<style lang="scss" scoped>
.playlist {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  z-index: 200;
  background-color: $color-background-d;
  &.list-fade-enter-active,
  &.list-fade-leave-active {
    transition: opacity 0.3s;
    .list-wrapper {
      transition: all 0.3s;
    }
  }
  &.list-fade-enter-from,
  &.list-fade-leave-to {
    opacity: 0;
    .list-wrapper {
      transform: translate3d(0, 100%, 0);
    }
  }
  .list-wrapper {
    position: fixed;
    left: 0;
    bottom: 0;
    z-index: 210;
    width: 100%;
    background-color: $color-highlight-background;
    .list-header {
      position: relative;
      padding: 20px 30px 10px 20px;
      .title {
        display: flex;
        align-items: center;
        .icon {
          margin-right: 10px;
          font-size: 24px;
          color: $color-theme-d;
        }
        .text {
          flex: 1;
          font-size: $font-size-medium;
          color: $color-text-l;
        }
        .clear {
          @include extend-click();
        }
      }
    }
    .list-content {
      max-height: 240px;
      overflow: hidden;
      .item {
        display: flex;
        align-items: center;
        height: 40px;
        padding: 0 30px 0 20px;
        overflow: hidden;
        .current {
          flex: 0 0 20px;
          width: 20px;
          font-size: $font-size-small;
          color: $color-theme-d;
        }
        .text {
          flex: 1;
          @include no-wrap();
          font-size: $font-size-medium;
          color: $color-text-d;
        }
        .favorite {
          @include extend-click();
          margin-right: 15px;
          font-size: $font-size-small;
          color: $color-theme;
          .icon-favorite {
            color: $color-sub-theme;
          }
        }
        .delete {
          @include extend-click();
          font-size: $font-size-small;
          color: $color-theme;
          &.disable {
            color: $color-theme-d;
          }
        }
      }
    }
    .list-add {
      width: 140px;
      margin: 20px auto 30px auto;
      .add {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        border: 1px solid $color-text-l;
        border-radius: 100px;
        color: $color-text-l;
        .icon-add {
          margin-right: 5px;
          font-size: $font-size-small-s;
        }
        .text {
          font-size: $font-size-small;
        }
      }
    }
    .list-footer {
      line-height: 50px;
      text-align: center;
      background: $color-background;
      font-size: $font-size-medium-x;
      color: $color-text-l;
    }
  }
}
</style>
