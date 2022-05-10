import { get } from './base'

export function processSongs(songs) {
  if (!songs.length) {
    return Promise.resolve(songs)
  }
  return get('/api/getSongsUrl', {
    mid: songs.map((song) => {
      return song.mid
    })
  }).then((result) => {
    const { map } = result
    return songs
      .map((song) => {
        song.url = map[song.mid]
        return song
      })
      .filter((song) => {
        return song.url && song.url.indexOf('vkey') > -1
      })
  })
}

const lyricMap = {}

export function getLyric(song) {
  // 如果存在歌词就直接return
  if (song.lyric) {
    return Promise.resolve(song.lyric)
  }
  const { mid } = song
  /** 进一步优化
   * song 这个对象，不同对象它的mid可能是相等的，所以这里可以定义lyricMap
   * lyricMap key是id 值是lyric
   */
  const lyric = lyricMap[mid]
  if (lyric) {
    return Promise.resolve(lyric)
  }
  return get('api/getLyric', {
    mid
  }).then((result) => {
    const lyric = result ? result.lyric : '[00:00:00]该歌曲暂无法获取歌词'
    lyricMap[mid] = lyric
    return lyric
  })
}
