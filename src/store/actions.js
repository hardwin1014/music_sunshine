import { PLAY_MODE } from '@/assets/js/constant'
import { shuffle } from '@/assets/js/util'

// 选择播放
export function selectPlay({ commit }, { list, index }) {
  commit('setPlayMode', PLAY_MODE.sequence)
  commit('setSequenceList', list)
  commit('setPlayingState', true)// 点击了要播放
  commit('setFullScreen', true) // 全屏
  commit('setPlaylist', list)
  commit('setCurrentIndex', index)
}

export function randomPlay({ commit }, list) {
  commit('setPlayMode', PLAY_MODE.random)
  commit('setSequenceList', list)
  commit('setPlayingState', true)
  commit('setFullScreen', true)
  commit('setPlaylist', shuffle(list))
  commit('setCurrentIndex', 0)
}

export function changeMode({ commit, state, getters }, mode) {
  // 先拿到当前播放的歌曲ID
  const currentId = getters.currentSong.id
  // 顺序播放 => 随机播放(洗牌)
  if (mode === PLAY_MODE.random) {
    // 洗牌
    commit('setPlaylist', shuffle(state.sequenceList))
  } else {
    commit('setPlaylist', state.sequenceList)
  }
  // 改变播放模式的时候，不要改变当前播放的歌曲，所以利用之前缓存的ID找到原来的歌曲下标
  const index = state.playlist.findIndex((song) => {
    return song.id === currentId
  })
  commit('setCurrentIndex', index)// 保证新列表中的索引的歌曲还是原来的歌曲
  commit('setPlayMode', mode)
}

export function removeSong({ commit, state }, song) {
  // 加上 slice 没有副作用
  const sequenceList = state.sequenceList.slice()
  const playlist = state.playlist.slice()

  // 找出 index 删除歌曲
  const sequenceIndex = findIndex(sequenceList, song)
  const playIndex = findIndex(playlist, song)
  if (sequenceIndex < 0 || playIndex < 0) {
    return
  }
  sequenceList.splice(sequenceIndex, 1)
  playlist.splice(playIndex, 1)
  let { currentIndex } = state
  if (playIndex < currentIndex || currentIndex === playlist.length) {
    currentIndex--
  }
  commit('setCurrentIndex', currentIndex)
  commit('setSequenceList', sequenceList)
  commit('setPlaylist', playlist)
  // 当歌曲为0的时候也要去停止播放状态
  if (!playlist.length) {
    commit('setPlayingState', false)
  }
}

export function addSong({ commit, state }, song) {
  const playlist = state.playlist.slice()
  const sequenceList = state.sequenceList.slice()
  let { currentIndex } = state
  const playIndex = findIndex(playlist, song) // 判断这个列表中是否包含这首歌
  if (playIndex > -1) {
    currentIndex = playIndex // 如果存在将 currentIndex = playIndex
  } else {
    playlist.push(song)
    currentIndex = playlist.length - 1 // 同时改变 currentIndex 对应歌曲
  }
  const sequenceIndex = findIndex(sequenceList, song)
  if (sequenceIndex === -1) {
    sequenceList.push(song)
  }

  commit('setSequenceList', sequenceList)
  commit('setPlaylist', playlist)
  commit('setCurrentIndex', currentIndex)
  commit('setPlayingState', true)
  commit('setFullScreen', true)
}

export function clearSongList({ commit }) {
  commit('setSequenceList', [])
  commit('setPlaylist', [])
  commit('setCurrentIndex', 0)
  commit('setPlayingState', false)
}

function findIndex(list, song) {
  return list.findIndex((item) => {
    return item.id === song.id
  })
}
