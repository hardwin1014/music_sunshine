import { useStore } from 'vuex'
import { PLAY_KEY } from '@/assets/js/constant'
import { save } from '@/assets/js/array-store'

export default function usePlayHistory() {
  const store = useStore()

  const maxLen = 200

  function savePlay(song) {
    // 将正在播放的歌曲储存
    const songs = save(song, PLAY_KEY, (item) => {
      return item.id === song.id
    }, maxLen)

    store.commit('setPlayHistory', songs)
  }

  return {
    savePlay
  }
}
