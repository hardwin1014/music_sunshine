<template>
  <div ref="rootRef">
    <slot></slot>
  </div>
</template>

<script>
  import useScroll from './use-scroll'
  import { ref } from 'vue'

  export default {
    name: 'scroll',
    props: {
      // 配置组件
      click: {
        type: Boolean,
        default: true
      },
      // 决定是否派发scroll事件,对页面性能有影响，尤其在useTransiton为TRUE的时候
      // 0代表任何时候都不派发scroll事件具体看文档
      // https://better-scroll.github.io/docs/zh-CN/guide/base-scroll-options.html#probetype
      probeType: {
        type: Number,
        default: 0
      }
    },
    // 自定义事件
    emits: ['scroll'],
    // emit可以吧事件当钩子函数传进去
    setup(props, { emit }) {
      const rootRef = ref(null)
      const scroll = useScroll(rootRef, props, emit)

      return {
        rootRef,
        scroll
      }
    }
  }
</script>
