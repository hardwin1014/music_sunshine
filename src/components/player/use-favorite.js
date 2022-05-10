import { computed } from 'vue'
import { useStore } from 'vuex'
import { save, remove } from '@/assets/js/array-store'
import { FAVORITE_KEY } from '@/assets/js/constant'

export default function useFavorite() {
  // data
  const maxLen = 100

  // vuex
  const store = useStore()
  const favoriteList = computed(() => store.state.favoriteList)

  // methods
  /** 判断歌曲是否存在 favoriteList 中 */
  function getFavoriteIcon(song) {
    return isFavorite(song) ? 'icon-favorite' : 'icon-not-favorite'
  }
  /** 收藏或删除歌曲 */
  function toggleFavorite(song) {
    let list
    if (isFavorite(song)) {
      list = remove(FAVORITE_KEY, compare)
    } else {
      list = save(song, FAVORITE_KEY, compare, maxLen)
    }
    store.commit('setFavoriteList', list)

    /**
     * 下面的findIndex 可以让开发人员自定义传参数compare，可以传id,也可以传mid
     * 所以可以利用这点，可以传入一个compare函数，这个compare函数的具体实现是在外部实现的
     * 对于这个库而言，只要支持用户可以传入一个compare函数，不用关心具体的实现细节，这个细节是外部来决定的
     * 只管调用就行了，相当于将这部分的逻辑剥离出去耦合了
     */
    function compare(item) {
      return item.id === song.id
    }
  }

  function isFavorite(song) {
    return (
      favoriteList.value.findIndex((item) => {
        return item.id === song.id
      }) > -1
    )
  }
  return { getFavoriteIcon, toggleFavorite }
}
