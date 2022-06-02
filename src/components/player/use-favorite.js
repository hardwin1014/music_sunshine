import { useStore } from 'vuex'
import { computed } from 'vue'
import { save, remove } from '@/assets/js/array-store'
import { FAVORITE_KEY } from '@/assets/js/constant'

// 实现单个多个歌曲收藏,刷新页面收藏按钮的状态仍然能显示
// 收藏交互 1.根据歌曲是否在收藏列表中来判断样式和状态,2.点击交互逻辑
export default function useFavorite() {
  const store = useStore()
  const favoriteList = computed(() => store.state.favoriteList) // 取出收藏列表
  const maxLen = 100 // 限制最大100首

  function getFavoriteIcon(song) {
    // 判断歌曲是否在列表中，返回不同的icon
    return isFavorite(song) ? 'icon-favorite' : 'icon-not-favorite'
  }

  // 添加和移除至收藏列表
  function toggleFavorite(song) {
    let list
    // 如果在收藏列表中，那么就移除，不在就添加
    if (isFavorite(song)) {
      list = remove(FAVORITE_KEY, compare)
    } else {
      // maxLen限制保存歌曲
      list = save(song, FAVORITE_KEY, compare, maxLen)
    }
    // 保存 返回一个新的list
    store.commit('setFavoriteList', list)

    // 自定义规则传入findIndex
    function compare(item) {
      return item.id === song.id
    }
  }

  function isFavorite(song) {
    // 判断歌曲是否在列表中，findIndex找不到会返回-1
    return favoriteList.value.findIndex((item) => {
      // 拿id判断是否在列表中
      return item.id === song.id
    }) > -1
  }

  return {
    getFavoriteIcon, // 判断当前歌曲是否在列表中
    toggleFavorite
  }
}
