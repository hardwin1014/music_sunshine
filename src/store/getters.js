// 当前播放歌曲是什么， 根据播放列表，播放索引
export const currentSong = (state) => {
  return state.playlist[state.currentIndex] || {}
}
