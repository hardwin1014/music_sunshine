import { PLAY_MODE, FAVORITE_KEY, SEARCH_KEY, PLAY_KEY } from '@/assets/js/constant'
import { load } from '@/assets/js/array-store'

const state = {
  sequenceList: [],
  playlist: [], // 播放列表
  playing: false, // 播放状态
  playMode: PLAY_MODE.sequence, // 播放模式
  currentIndex: 0, // 歌曲索引
  fullScreen: false, // 播放器的状态
  favoriteList: load(FAVORITE_KEY), // 已收藏的列表
  searchHistory: load(SEARCH_KEY),
  playHistory: load(PLAY_KEY),
  routeLink: [],
  currentPageIndex: 0
}
export default state
