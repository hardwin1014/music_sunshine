<template>
  <teleport to="body">
    <transition name="slide">
      <div class="add-song" v-show="visible">
        <div class="header">
          <h1 class="title">添加歌曲到列表</h1>
          <div class="close" @click="hide">
            <i class="icon-close"></i>
          </div>
        </div>
        <div class="search-input-wrapper">
          <search-input placeholder="搜索歌曲" v-model="query" />
        </div>
        <div v-show="!query">
          <switches :items="['最近播放', '搜索历史']" v-model="currentIndex"></switches>
          <div class="list-wrapper">
            <scroll class="list-scroll" ref="scrollRef" v-if="currentIndex === 0">
              <div class="list-inner">
                <song-list :songs="playHistory" @select="selectSongBySongList"></song-list>
              </div>
            </scroll>
            <scroll class="list-scroll" ref="scrollRef" v-if="currentIndex === 1">
              <div class="list-inner">
                <div class="search-list">
                  <search-list :searches="searchHistory" @select="addQuery" :show-delete="false" />
                </div>
              </div>
            </scroll>
          </div>
        </div>
        <div class="search-result" v-show="query">
          <suggest :query="query" :show-singer="false" @select-song="selectSongBySuggest" />
        </div>
        <message ref="messageRef">
          <div class="message-title">
            <i class="icon-ok"></i>
            <span class="text">1首歌曲已经添加到播放列表</span>
          </div>
        </message>
      </div>
    </transition>
  </teleport>
</template>

<script>
import SearchInput from '@/components/search/search-input'
import Suggest from '@/components/search/suggest'
import Switches from '@/components/base/switches/switches'
import Scroll from '@/components/base/scroll/scroll'
import SearchList from '@/components/base/search-list/search-list'
import Message from '@/components/base/message/message'
import SongList from '@/components/base/song-list/song-list'
import useSearchHistory from '@/components/search/use-search-history'
import { ref } from '@vue/reactivity'
import { computed, nextTick } from '@vue/runtime-core'
import { useStore } from 'vuex'

export default {
  components: {
    SearchInput,
    Switches,
    Scroll,
    SearchList,
    Message,
    SongList,
    Suggest
  },
  setup() {
    // data
    const currentIndex = ref(0)
    const query = ref('')
    const visible = ref(false)
    const messageRef = ref(null)
    const scrollRef = ref(null)

    // computed
    const store = useStore()
    const searchHistory = computed(() => store.state.searchHistory)
    const playHistory = computed(() => store.state.playHistory)

    // hooks
    const { saveSearch } = useSearchHistory()

    // methods
    function addQuery(s) {
      query.value = s
    }
    function hide() {
      visible.value = false
    }
    async function show() {
      visible.value = true
      await nextTick()
      refreshScroll()
    }
    function selectSongBySongList({ song }) {
      addSong(song)
    }
    function selectSongBySuggest(song) {
      addSong(song)
      saveSearch(query.value)
    }
    function addSong(song) {
      store.dispatch('addSong', song)
      showMessage()
    }
    function refreshScroll() {
      scrollRef.value.scroll.refresh()
    }
    function showMessage() {
      messageRef.value.show()
    }
    return {
      // data
      currentIndex,
      visible,
      scrollRef,
      messageRef,
      query,
      // computed
      searchHistory,
      playHistory,
      // methods
      addQuery,
      hide,
      show,
      refreshScroll,
      selectSongBySongList,
      selectSongBySuggest
    }
  }
}
</script>

<style lang="scss" scoped>
.add-song {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 100%;
  z-index: 300;
  background: $color-background;
  .header {
    position: relative;
    height: 44px;
    text-align: center;
    .title {
      line-height: 44px;
      font-size: $font-size-large;
      color: $color-text;
    }
    .close {
      position: absolute;
      top: 0;
      right: 8px;
      .icon-close {
        display: block;
        padding: 12px;
        font-size: 20px;
        color: $color-theme;
      }
    }
  }
  .search-input-wrapper {
    margin: 20px;
  }
  .search-result {
    position: fixed;
    top: 124px;
    bottom: 0;
    width: 100%;
  }
  .list-wrapper {
    position: absolute;
    top: 165px;
    bottom: 0;
    width: 100%;
    .list-scroll {
      height: 100%;
      overflow: hidden;
      .list-inner {
        padding: 20px 30px;
      }
      &.test-enter-active,
      &.test-leave-active {
        transition: all 0.3s;
      }
      &.test-enter-from,
      &.test-leave-to {
        transform: translateX(100%);
      }
    }
  }
}
.message-title {
  text-align: center;
  padding: 18px 0;
  font-size: 0;
  .icon-ok {
    font-size: $font-size-medium;
    color: $color-theme;
    margin-right: 4px;
  }
  .text {
    font-size: $font-size-medium;
    color: $color-text;
  }
}
</style>
