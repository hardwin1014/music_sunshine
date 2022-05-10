export function addClass(el, className) {
  // js的contains方法用来查看dom元素的包含关系
  if (!el.classList.contains(className)) {
    el.classList.add(className)
  }
}

export function removeClass(el, className) {
  // 删除一个不存在的 class 不会报错 所以不用判断
  el.classList.remove(className)
}
