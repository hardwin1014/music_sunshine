<template>
  <div class="search">
    <div class="search-input-wrapper">
      <search-input v-model="query" />
    </div>
    <scroll
      ref="scrollRef"
      class="search-content"
      v-show="!query"
      @touchstart.prevent="onTouchStart"
      @touchmove.prevent="onTouchMove"
      @touchend.prevent="onTouchEnd"
    >
      <div>
        <div class="hot-keys">
          <h1 class="title">热门搜索</h1>
          <ul>
            <li
              class="item"
              v-for="item in hotKeys"
              :key="item.id"
              @click.stop="addQuery(item.key)"
            >
              <span>{{ item.key }}</span>
            </li>
          </ul>
        </div>
        <div class="search-history" v-show="searchHistory.length">
          <h1 class="title">
            <span class="text">搜索历史</span>
            <span class="clear" @click.stop="showConfirm">
              <i class="icon-clear"></i>
            </span>
          </h1>
          <search-list :searches="searchHistory" @select="addQuery" @delete="deleteSearch" />
          <confirm
            ref="confirmRef"
            text="是否清空所有搜索历史"
            confirm-btn-text="清空"
            @confirm="clearSearch"
          ></confirm>
        </div>
      </div>
    </scroll>
    <div class="search-result" v-show="query">
      <suggest :query="query" @select-song="selectSong" @select-singer="selectSinger"></suggest>
    </div>
    <router-view v-slot="{ Component }">
      <transition appear name="slide">
        <component :is="Component" :data="selectedSinger" />
      </transition>
    </router-view>
  </div>
</template>

<script>
import SearchInput from '@/components/search/search-input'
import Suggest from '@/components/search/suggest'
import SearchList from '@/components/base/search-list/search-list'
import Scroll from '@/components/wrap-scroll'
import Confirm from '@/components/base/confirm/confirm'
import { ref } from '@vue/reactivity'
import { getHotKeys } from '@/service/search'
import storage from 'good-storage'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { SINGER_KEY } from '@/assets/js/constant'
import { computed, nextTick, watch } from '@vue/runtime-core'
import useSearchHistory from '@/components/search/use-search-history'
import { fingerMixin } from '@/assets/js/mixin.js'

export default {
  mixins: [fingerMixin],
  components: {
    SearchInput,
    Suggest,
    SearchList,
    Scroll,
    Confirm
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    // data
    const query = ref('')
    const hotKeys = ref([])
    const selectedSinger = ref(null)
    const scrollRef = ref(null)
    const confirmRef = ref(null)
    // computed
    const searchHistory = computed(() => store.state.searchHistory)

    // watch
    watch(query, async (newQuery) => {
      if (!newQuery) {
        await nextTick()
        refreshScroll()
      }
    })
    // hooks
    const { saveSearch, deleteSearch, clearSearch } = useSearchHistory()

    // http
    getHotKeys().then((result) => {
      hotKeys.value = result.hotKeys
    })

    // methods
    function addQuery(s) {
      query.value = s
    }

    function refreshScroll() {
      scrollRef.value.scroll.refresh()
    }

    function selectSong(song) {
      saveSearch(query.value)
      store.dispatch('addSong', song)
    }

    function selectSinger(singer) {
      saveSearch(query.value)
      selectedSinger.value = singer
      cacheSinger(singer)

      router.push({
        path: `/search/${singer.mid}`
      })
    }

    function showConfirm() {
      confirmRef.value.show()
    }

    function cacheSinger(singer) {
      storage.session.set(SINGER_KEY, singer)
    }
    return {
      // data
      query,
      hotKeys,
      addQuery,
      selectedSinger,
      scrollRef,
      confirmRef,
      // computed
      searchHistory,
      // methods
      selectSong,
      selectSinger,
      showConfirm,
      // useSearchHistory
      saveSearch,
      deleteSearch,
      clearSearch
    }
  }
}
</script>

<style lang="scss" scoped>
.search {
  position: fixed;
  width: 100%;
  top: 88px;
  bottom: 0;
  display: flex;
  flex-direction: column;
  .search-input-wrapper {
    margin: 20px;
  }
  .search-content {
    flex: 1;
    overflow: hidden;
    .hot-keys {
      margin: 0 20px 20px 20px;
      .title {
        margin-bottom: 20px;
        font-size: $font-size-medium;
        color: $color-text-l;
      }
      .item {
        display: inline-block;
        padding: 5px 10px;
        margin: 0 20px 10px 0;
        border-radius: 6px;
        background: $color-highlight-background;
        font-size: $font-size-medium;
        color: $color-text-d;
      }
    }
    .search-history {
      position: relative;
      margin: 0 20px;
      .title {
        display: flex;
        align-items: center;
        height: 40px;
        font-size: $font-size-medium;
        color: $color-text-l;
        .text {
          flex: 1;
        }
      }
    }
  }
  .search-result {
    flex: 1;
    overflow: hidden;
  }
}
</style>
