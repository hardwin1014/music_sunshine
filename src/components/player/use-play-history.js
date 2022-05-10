import { PLAY_KEY } from '@/assets/js/constant'
import { save } from '@/assets/js/array-store'
import { useStore } from 'vuex'

export default function usePlayHistory() {
  const maxLen = 200
  const store = useStore()
  function savePlay(song) {
    const songs = save(
      song,
      PLAY_KEY,
      (item) => {
        return item.id === song.id
      },
      maxLen
    )
    store.commit('setPlayHistory', songs)
  }

  return {
    savePlay
  }
}
