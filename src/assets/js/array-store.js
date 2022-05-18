import storage from 'good-storage'

export function save(item, key, compare, maxLen) {
  const items = storage.get(key, []) // 读取现有的数据, 默认为空
  inertArray(items, item, compare, maxLen) // 插入数组中
  storage.set(key, items)
  return items
}

// 移除
export function remove(key, compare) {
  const items = storage.get(key, [])
  deleteFromArray(items, compare)
  storage.set(key, items)
  return items
}

// 加载收藏列表数据
export function load(key) {
  return storage.get(key, [])
}

function inertArray(arr, val, compare, maxLen) {
  // 支持传入compare函数, 自己在外部定义规则
  const index = arr.findIndex(compare) // -1
  if (index === 0) {
    return
  }
  // 如果原数组中有，那就删除，在下面重新插入
  if (index > 0) {
    arr.splice(index, 1)
  }
  arr.unshift(val) // 插入array第一项
  // 收藏最大值100
  if (maxLen && arr.length > maxLen) {
    arr.pop() // 先进先出
  }
}

function deleteFromArray(arr, compare) {
  const index = arr.findIndex(compare)
  // 如果找到,直接删掉了
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
