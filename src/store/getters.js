// 当前播放歌曲是什么， 根据播放列表，播放索引
export const currentSong = (state) => {
  // 一开始playList是一个空数组，取第一项是undefined会导致页面错误，渲染不出来
  // undefined.xxx报错，当值为undefined的时候给他一个{}，对象可以点属性
  // 或者在使用数据的地方,外层使用v-if判断是否渲染
  return state.playlist[state.currentIndex] || {}
}
