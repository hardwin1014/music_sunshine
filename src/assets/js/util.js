/** 洗牌算法 */
export function shuffle(source) {
  /**
   * 在编写一些工具函数时，尽量不要用副作用，就是不要改变原始的值
   */
  const arr = source.slice()
  for (let i = 0; i < arr.length; i++) {
    const j = getRandomInt(i)
    swap(arr, i, j)
  }
  return arr
}

function getRandomInt(max) {
  return Math.floor(Math.random() * (max + 1))
}

function swap(arr, i, j) {
  const t = arr[i]
  arr[i] = arr[j]
  arr[j] = t
}

export function formatTime(interval) {
  interval |= 0 // 向下取整
  const minute = `${(interval / 60) | 0}`.padStart(2, '0')
  const second = `${interval % 60}`.padStart(2, '0')
  return `${minute}:${second}`
}
