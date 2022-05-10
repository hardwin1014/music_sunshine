import storage from 'good-storage'

export function save(item, key, compare, maxLen) {
  const items = storage.get(key, []) // 默认为空
  inertArray(items, item, compare, maxLen)
  storage.set(key, items)
  return items
}

export function remove(key, compare) {
  const items = storage.get(key, [])
  deleteFromArray(items, compare)
  storage.set(key, items)
  return items
}

export function load(key) {
  return storage.get(key, [])
}

function inertArray(arr, val, compare, maxLen) {
  const index = arr.findIndex(compare) // -1
  if (index === 0) {
    return
  }
  if (index > 0) {
    arr.splice(index, 1)
  }
  arr.unshift(val) // 插入array第一项
  // 收藏最大值
  if (maxLen && arr.length > maxLen) {
    arr.pop() // 先进先出
  }
}

function deleteFromArray(arr, compare) {
  const index = arr.findIndex(compare)
  if (index > -1) {
    arr.splice(index, 1)
  }
}

export function clear(key) {
  storage.remove(key)
  return []
}

export function saveAll(items, key) {
  storage.set(key, items)
}

export function saveRouterLink(items, key) {
  storage.set(items.key)
}
