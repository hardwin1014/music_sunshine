## 优化技巧
+ 在计算属性中,使用的变量大于一次的时候,要使用临时变量缓存，因为每次执行this.xxx的时候会执行依赖收集，性能优化
+ vue3使用Composition API拿vuex的数据 const store = useStore()
+ 利用计算属性,把数据处理成响应式的
const fullScreen = computed(() => store.state.fullScreen)
## 一

全局引入变量和 mixin

```
module.exports = {
  css: {
    loaderOptions: {
      sass: {
      // 全局引入变量和 mixin
        prependData: `
        @import "@/assets/scss/variable.scss";
        @import "@/assets/scss/mixin.scss";`
      }
    }
  }
}
```

## 第2章 项目初始化和推荐页面开发

### 2-11 2-12 v-loading 自定义指令的开发

```js
import { createApp } from 'vue'
import Loading from './loading.vue'

const loadingDirective = {
    mounted(el, binding) {
        // vue 是可以多实例的
        const app = createApp(Loading) // loading 组件
        // DOM 对象
        const instance = app.mount(document.createElement('div'))
        // 保存起来 方便多次使用
        el.instance = instance
        if (binding.value) {
            append(el)
        }
    },
    updated(el, binding) {
        // 当 前后值不一样时
        if (binding.value !== binding.oldValue) {
            // 执行添加 或 移除 操作
            binding.value ? append(el) : remove(el)
        }
    }
}

function append(el) {
    el.appendChild(el.instance.$el)
}

function remove(el) {
    el.removeChild(el.instance.$el)
}

export default loadingDirective

```

此时还存在一些问题

> loading 组件要求 外层容器的定位是 'absolute', 'fixed', 'relative'

```js
import { createApp } from 'vue'
import { addClass, removeClass } from '../../../assets/js/dom'
import Loading from './loading.vue'
const relativeCls = 'g-relative'

const loadingDirective = {
    mounted(el, binding) {
        // vue 是可以多实例的
        const app = createApp(Loading) // loading 组件
        // DOM 对象
        const instance = app.mount(document.createElement('div'))
        // 保存起来 方便多次使用
        el.instance = instance
        if (binding.value) {
            append(el)
        }
    },
    updated(el, binding) {
        // 当 前后值不一样时
        if (binding.value !== binding.oldValue) {
            // 执行添加 或 移除 操作
            binding.value ? append(el) : remove(el)
        }
    }
}

function append(el) {
    console.log(el.classList)
    // el.instance.$el  loading 组件的DOM对象
    /** 还存在一些问题 ：：
     * loading 组件要求 外层容器的定位是 'absolute', 'fixed', 'relative'
     */
    const style = getComputedStyle(el) // getComputedStyle 用于获取指定元素的css
    if (['absolute', 'fixed', 'relative'].indexOf(style.position) === -1) {
        addClass(el, relativeCls)
    }
    console.log(el.style)
    el.appendChild(el.instance.$el)
}

function remove(el) {
    removeClass(el, relativeCls)
    el.removeChild(el.instance.$el)
}

export default loadingDirective

```

dom.js

```js
export function addClass(el, className) {
    console.log(el.classList)
    if (!el.classList.contains(className)) {
        el.classList.add(className)
    }
}

export function removeClass(el, className) {
    // 删除一个不存在的 class 不会报错 所以不用判断
    el.classList.remove(className)
}
```

设置 加载文本

recommend.vue 中

```html
<div class="recommend" v-loading:[Text]="loading">
    Text: '测试测试...'
```

```js
 mounted(el, binding) {
        console.log(binding)
        // vue 是可以多实例的
        const app = createApp(Loading) // loading 组件
        // DOM 对象
        const instance = app.mount(document.createElement('div'))
        // 保存起来 方便多次使用
        el.instance = instance
        const title = binding.arg
        if (typeof title !== 'undefined') {
            instance.setTitle(title)
        }
        if (binding.value) {
            append(el)
        }
    },
    updated(el, binding) {
        const title = binding.arg
        if (typeof title !== 'undefined') {
            el.instance.setTitle(title)
        }
        // 当 前后值不一样时
        if (binding.value !== binding.oldValue) {
            // 执行添加 或 移除 操作
            binding.value ? append(el) : remove(el)
        }
    }
```

## 第三章

### 3-1 歌手列表数据获取

### 3-2 IndexList 组件基础滚动功能实现

### 3-3  3-4 歌手列表固定标题实现（上）（中）

scroll 组件中修改配置

```js
emits: ['scroll'],
  setup(props, { emit }) {
    const rootRef = ref(null)
    useScroll(rootRef, props, emit)
    return { rootRef }
  }
```

```js
  // 根据传入的probeType来控制 滚动的监听强度 来节约资源
        if (options.probeType > 0) {
            scrollVal.on('scroll', (pos) => {
                emit('scroll', pos)
            })
        }
```



index-list 传入type = 3 与监听事件

```vue
<scroll :probe-type="3" @scroll="onScroll">...</scroll>
setup(props) {
    // eslint-disable-next-line no-undef
    const { groupRef, onScroll, fixedTitle } = useFixed(props)
    return { groupRef, onScroll, fixedTitle }
  }
```

use-fixed.js

```js
import { computed, nextTick, ref, watch } from 'vue'

export default function useFixed(props) {
    const groupRef = ref(null)
    const listHeights = ref([])
    const scrollY = ref(0)
    const currentIndex = ref(0) // 当前渲染组的索引
    // const distance = ref(0)

    const fixedTitle = computed(() => {
        if (scrollY.value < 0) {
            return ''
        }
        const currentGroup = props.data[currentIndex.value]
        return currentGroup ? currentGroup.title : ''
    })

    watch(() => props.data, async () => {
        /**
         * 这样写还是存在问题
         * 当数据发生变化之后，这个回调函数内部的DOM还是没有发生变化的
         * DOM发生变化是在nextTick 之后
         */
        // nextTick(() => {
        //     calculate()
        // })
        await nextTick()
        calculate()
    })

    watch(scrollY, (newY) => {
        const listHeightsVal = listHeights.value
        for (let i = 0; i < listHeightsVal.length - 1; i++) {
            const heightTop = listHeightsVal[i]
            const heightBottom = listHeightsVal[i + 1]
            // 此时落在区间上
            if (newY >= heightTop && newY <= heightBottom) {
                currentIndex.value = i
                return
            }
        }
    })
    /** 计算
     * 什么情况的时候去计算，当数据变化时，DOM就会发生变化，也就是DOM变化后要去计算
     */
    function calculate() {
        const list = groupRef.value.children
        const listHeightsVal = listHeights.value
        let height = 0
        listHeightsVal.length = 0
        listHeightsVal.push(height)
        for (let i = 0; i < list.length; i++) {
            // 每个元素对应的DOM
            /**
             * 这里为什么要累加? 因为滚动的一个值 就列表的高度 从0到最大滚动高度就一个不断递增的值
             * 所以区间也要这样记录，方便对应它们的关系
             */
            height += list[i].clientHeight
            listHeightsVal.push(height)
        }
        console.log(listHeightsVal)
    }

    function onScroll(pos) {
        // 这里scroll 往下滑动时反馈的值是一个负值
        scrollY.value = -pos.y
    }
    return { groupRef, onScroll, fixedTitle }
}

```

### 3-6 歌手列表固定标题实现（下）

当标题快接近fixedTitle 的时候是一个顶上去的交互效果

```js
watch(scrollY, (newY) => {
        const listHeightsVal = listHeights.value
        for (let i = 0; i < listHeightsVal.length - 1; i++) {
            const heightTop = listHeightsVal[i]
            const heightBottom = listHeightsVal[i + 1]
            // 此时落在区间上
            // newY >= 0 && newT <= 760
            if (newY >= heightTop && newY <= heightBottom) {
                currentIndex.value = i
                distance.value = heightBottom - newY // 距离
            }
        }
    })
```

```js
 const fixedStyle = computed(() => {
        const distanceVal = distance.value
        const diff = (distanceVal > 0 && distanceVal < TITLE_HEIGHT) ? distanceVal - TITLE_HEIGHT : 0
        return {
            transform: `translate3d(0,${diff}px,0)`
        }
    })
```

```vue
<div class="fixed" v-show="fixedTitle" :style="fixedStyle">
        <div class="fixed-title">{{ fixedTitle }}</div>
      </div>
```

### 3-7 歌手列表快速导航入口实现（01）

```vue
<div class="shortcut">
        <ul>
          <li
            v-for="(item, index) in shortcutList"
            :key="index"
            class="item"
            :class="{ current: currentIndex === index }"
          >
            {{ item }}
          </li>
        </ul>
      </div>
<script>
export default {
  props: {
    data: {
      type: Array,
      default() {
        return []
      }
    }
  },
  components: {
    Scroll
  },
  setup(props) {
    // eslint-disable-next-line no-undef
    const { groupRef, onScroll, fixedTitle, fixedStyle, currentIndex } = useFixed(props)
    const { shortcutList } = useShortcut(props)
    return { groupRef, onScroll, fixedTitle, fixedStyle, shortcutList, currentIndex }
  }
}
</script>
```

### 3-8 歌手列表快速导航入口实现（02）

当点击字母的时候可以去切换对应的组，当用手指拖动的时候根据拖动情况去切换对应的组

点击交互： 在移动端通常会监听一些touch事件比如touchMove等，那么betterScroll 也是基于touch事件实现的滚动，那么就可以监听touchStatr事件， 那么可不可以为每个元素都监听一个touchStatr事件？ 因为可以拿到元素所在的列表中的一个索引，然后这个索引可以对应的组的DOM，这样做是没问题的，问题是要去为每个元素都去做touchStart事件，是非常没有必要的，可以通过父元素去绑定一个事件，通过事件委托的方式，这样性能会更好，可以通过target拿到对应的索引

利用better-scroll 内置API `scrollToElement`

scrollToElement(el, time, offsetX, offsetY, easing)

- 参数
  - {DOM | string} el 滚动到的目标元素, 如果是字符串，则内部会尝试调用 querySelector 转换成 DOM 对象。
  - {number} time 滚动动画执行的时长（单位 ms）
  - {number | boolean} offsetX 相对于目标元素的横轴偏移量，如果设置为 true，则滚到目标元素的中心位置
  - {number | boolean} offsetY 相对于目标元素的纵轴偏移量，如果设置为 true，则滚到目标元素的中心位置
  - {Object} easing 缓动函数，一般不建议修改，如果想修改，参考源码中的 `packages/shared-utils/src/ease.ts` 里的写法
- **返回值**：无
- **作用**：滚动到指定的目标元素

index-list.vue

```vue
 <div
        class="shortcut"
        @touchstart.stop.prevent="onShortcutTouchStart"
        @touchmove.stop.prevent="onShortcutTouchMove"
        @touchend.stop.prevent
      >
        <ul>
          <li
            v-for="(item, index) in shortcutList"
            :key="index"
            class="item"
            :data-index="index"
            :class="{ current: currentIndex === index }"
          >
            {{ item }}
          </li>
        </ul>
      </div>
```

scroll.vue

将 scroll return出去

```
setup(props, { emit }) {
    const rootRef = ref(null)
    const scroll = useScroll(rootRef, props, emit)
    return { rootRef, scroll }
  }
```

use-scroll.js

```js
export default function useScroll(wrapperRef, options, emit) {
    const scroll = ref(null)
    onMounted(() => {
        /** BScroll 判断能不能滚动 new 的时候 此时会做计算
         *  debugger 的时候scroll 标签里面的内容是没有的，所以就不满足滚动条件，就不能滚动
         * 解决： 利用 observe-dom 当 DOM 元素发生变化时去自动调用 refresh 方法
         */
        const scrollVal = scroll.value = new BScroll(wrapperRef.value, {
            observeDOM: true,
            ...options
        })

        // 根据传入的probeType来控制 滚动的监听强度 来节约资源
        if (options.probeType > 0) {
            scrollVal.on('scroll', (pos) => {
                emit('scroll', pos)
            })
        }
    })
    onUnmounted(() => {
        scroll.value.destroy()
    })
    return scroll
}

```

index-list.vue 

利用自定义属性 :data-index="index" 便于获取DOM

```vue
<ul>
          <li
            v-for="(item, index) in shortcutList"
            :key="index"
            class="item"
            :data-index="index"
            :class="{ current: currentIndex === index }"
          >
            {{ item }}
          </li>
        </ul>
export default {
  setup(props) {
    // eslint-disable-next-line no-undef
    const { groupRef, onScroll, fixedTitle, fixedStyle, currentIndex } = useFixed(props)
    const { shortcutList, onShortcutTouchStart, scrollRef } = useShortcut(props, groupRef)
    return { groupRef, onScroll, fixedTitle, fixedStyle, shortcutList, currentIndex, onShortcutTouchStart, scrollRef }
  }
}
```

use-shortcut.js

```js
    function onShortcutTouchStart(e) {
        const anchorIndex = parseInt(e.target.dataset.index) // 索引
        const targetEl = groupRef.value.children[anchorIndex] // 通过索引拿到对应组的DOM
        const scroll = scrollRef.value.scroll
        scroll.scrollToElement(targetEl, 500) // 调用betterScroll 的 scrollToElement 方法
    }
```

### 3-9 歌手列表快速导航入口实现（03）

手指交互的效果是怎么实现的？

前面的是根据touchstart索引求得的位置，那么怎么根据touchmove去拿到索引？在touchstart是有一个初始的值，并且可以拿到手指触碰的纵坐标，在touchmove也可以拿到纵坐标。用touchmove的纵坐标减去touchstart的纵坐标求得差，求出锚点高度这样可以知道偏移了几个身位，然后根据初始的索引去加上这个差，就可以求得touchmove的一个索引



```js
import { computed, ref } from 'vue'

export default function useShortcut(props, groupRef) {
    const scrollRef = ref(null)
    const ANCHOR_HEIGHT = 18
    const touch = {} // 记录坐标
    const shortcutList = computed(() => {
        return props.data.map((group) => {
            return group.title
        })
    })
    function onShortcutTouchStart(e) {
        const anchorIndex = parseInt(e.target.dataset.index) // 索引
        touch.y1 = e.touches[0].pageY
        touch.anchorIndex = anchorIndex
        scrollTo(anchorIndex)
    }
    function onShortcutTouchMove(e) {
        // 记录touchstart、touchmove的纵坐标
        touch.y2 = e.touches[0].pageY
        const delta = (touch.y2 - touch.y1) / ANCHOR_HEIGHT | 0 // 差值 | 0 意思是整数向下取整的简写法
        const anchorIndex = touch.anchorIndex + delta
        scrollTo(anchorIndex)
    }

    function scrollTo(index) {
        if (isNaN(index)) {
            return
        }
        index = Math.max(0, Math.min(shortcutList.value.length - 1, index))
        const targetEl = groupRef.value.children[index] // 通过索引拿到对应组的DOM
        const scroll = scrollRef.value.scroll
        scroll.scrollToElement(targetEl, 500) // 调用betterScroll 的 scrollToElement 方法
    }
    return { shortcutList, onShortcutTouchStart, scrollRef, onShortcutTouchMove }
}

```

## 第四章

### 4-2 歌手详情页批量获取歌曲

### 4-3 歌手详情页 MusicList 组件基础代码编写

### 4-4 歌手详情页 MusicList 组件功能交互优化（01)

music-list.vue 里面的背景是没有高度的而是用top挤开的，因为scroll组件里面用了定位，一进入页面scroll占满了全屏 而且是无法滚动的，

```
    position: absolute;
    bottom: 0;
    z-index: 30;
    width: 100%;
```

此时需要利用背景图片的高度来动态计算 scroll 里面的top值, 实现动态计算高度，而且可以滚动了，为什么可以滚动？一旦设置top值，容器是固定的，内容的高度远远超过容器的高度就可以滚动

```js
  computed: {
    scrollStyle() {
      return {
        top: `${this.imageHeight}px`
      }
    }
  },
  mounted() {
    this.imageHeight = this.$refs.bgImage.clientHeight
  }
```

### 4-5  4-6歌手详情页 MusicList 组件功能交互优化

效果： 当滚动到顶端时，标题固定，而且往上拉时背景图片会有一个放大的效果，类似于app里面的效果

分析：用图片的高度减去标题的高度

```js
    this.maxTranslateY = this.imageHeight - RESERVED_HEIGHT // 可以滚动最大距离的高度
```

当 scrollY > this.maxTranslateY 时 将 设置为  zIndex = 10 标题就可以不被覆盖

当往下来有图片放大的效果

```
if (scrollY < 0) {
        scale = 1 + Math.abs(scrollY / this.imageHeight)
      }
```

具体代码

```js
bgImageStyle() {
      const scrollY = this.scrollY
      let zIndex = 0
      let paddingTop = '70%'
      let height = 0
      let translateZ = 0 // 处理ios兼容
      let scale = 1
      if (scrollY > this.maxTranslateY) {
        zIndex = 10
        paddingTop = 0
        height = `${RESERVED_HEIGHT}px`
        translateZ = 1
      }

      if (scrollY < 0) {
        scale = 1 + Math.abs(scrollY / this.imageHeight)
      }
      return {
        paddingTop,
        height,
        backgroundImage: `url(${this.pic})`,
        zIndex,
        transform: `scale(${scale})translateZ(${translateZ}px)`
      }
    },
```

4-4 歌手详情页 MusicList 组件功能交互优化（03)

当往上来遮挡到背景图片时会有一个模糊的效果

分析：可以借助一个css属性`background-filter` 滤镜，可以作用在一个半透明层

[backdrop-filter - CSS（层叠样式表） | MDN (mozilla.org)](https://developer.mozilla.org/zh-CN/docs/Web/CSS/backdrop-filter)

```vue
    <div class="filter" :style="filterStyle"></div>

```

```js
 filterStyle() {
      let blur = 0
      const scrollY = this.scrollY
      const imageHeight = this.imageHeight
      if (scrollY >= 0) {
        blur = Math.min(this.maxTranslateY / imageHeight, scrollY / imageHeight) * 20
      }
      return {
        backdropFilter: `blur(${blur}px)`
      }
    }
```

#### 关于性能优化

编码中，可能会发现，用了许多的临时变量 比如 `const imageHeight = this.imageHeight`, 当在一个计算属性中取一个响应式变量大于一次的时候，一定要用一个临时变量缓存，这也是vue的常用优化技巧，因为每次this.xxx的时候呢，它会执行vue里面的依赖收集的过程，当频繁执行的时候呢，也就是频繁使用this.xxx，这个依赖收集会发生多次，显然这个是非常没有必要的，用本地局部变量去缓存就行了，这时是不会触发依赖收集的

### 4-7 歌手详情页支持详情页刷新

解决页面刷新时报错问题

分析：刷新的报错原因是，数据是从一级路由传递到二级路由，通过props拿到数据，当刷新之后数据就丢失了。

解决： 本地缓存， 如果props无数据就取缓存里面的

[good-storage - npm (npmjs.com)](https://www.npmjs.com/package/good-storage)

```
 npm install good-storage
```

```
 import storage from 'good-storage'
 
 // localStorage
 storage.set(key,val) 
 
 storage.get(key, def)
 
 // sessionStorage
 storage.session.set(key, val)
 
 storage.session.get(key, val)
```

singer.vue 

当路由跳转之前将数据放进缓存里面

```js
methods: {
    selectSinger(singer) {
      this.selectedSinger = singer
      this.cacheSinger(singer)
      this.$router.push({
        path: `/singer/${singer.mid}`
      })
    },
    cacheSinger(singer) {
      storage.session.set(SINGER_KEY, singer)
    }
  }
```

singer-detail.vue

```js
computedData() {
      let ret = null
      const singer = this.singer
      if (singer) {
        return singer
      } else {
        const cacheSinger = storage.session.get(SINGER_KEY)
        if (cacheSinger && cacheSinger.mid === this.$route.params.id) {
          ret = cacheSinger
        }
      }
      return ret
    }
```

```js
async created() {
    if (!this.computedData) {
      const path = this.$route.matched[0].path
      this.$router.push({ path })
    }
    const result = await getSingerDetail(this.computedData)
    const songs = await processSongs(result.songs)
    this.songs = songs
    this.loading = false
  }
```

### 4-8 歌手详情页路由过渡效果实现

vue3 和 vue2 的动画略有改变

```vue
<router-view v-slot="{ Component }">
      <transition appear name="slide">
        <component :is="Component" :data="selectedSinger" />
      </transition>
    </router-view>
```

### 4-9 歌手详情页边界情况处理



当歌曲列表为空是时候，渲染no-Result组件，这个组件和Loading组件非常相似，可以将逻辑抽离开来

 assets/js/create-loading-like-directive.js

```js
import { createApp } from 'vue'
import { addClass, removeClass } from '@/assets/js/dom'
const relativeCls = 'g-relative'

export default function createLoadingLikeDirective(Comp) {
    return {
        mounted(el, binding) {
            // vue 是可以多实例的
            const app = createApp(Comp) // loading 组件
            // DOM 对象
            const instance = app.mount(document.createElement('div'))
            // 保存起来 方便多次使用
            el.instance = instance
            const title = binding.arg
            if (typeof title !== 'undefined') {
                instance.setTitle(title)
            }
            if (binding.value) {
                append(el)
            }
        },
        updated(el, binding) {
            const title = binding.arg
            if (typeof title !== 'undefined') {
                el.instance.setTitle(title)
            }
            // 当 前后值不一样时
            if (binding.value !== binding.oldValue) {
                // 执行添加 或 移除 操作
                binding.value ? append(el) : remove(el)
            }
        }
    }

    function append(el) {
        // el.instance.$el  loading 组件的DOM对象
        /** 还存在一些问题 ：：
         * loading 组件要求 外层容器的定位是 'absolute', 'fixed', 'relative'
         */
        const style = getComputedStyle(el) // getComputedStyle 用于获取指定元素的css
        if (['absolute', 'fixed', 'relative'].indexOf(style.position) === -1) {
            addClass(el, relativeCls)
        }
        el.appendChild(el.instance.$el)
    }

    function remove(el) {
        removeClass(el, relativeCls)
        el.removeChild(el.instance.$el)
    }
}
```

loading/directive.js

```js
import Loading from './loading.vue'
import createLoadingLikeDirective from '@/assets/js/create-loading-like-directive'
const loadingDirective = createLoadingLikeDirective(Loading)
export default loadingDirective
```

no-result/directive.js

```js
import NoResult from './no-result'
import createLoadingLikeDirective from '@/assets/js/create-loading-like-directive'

const noResultDirective = createLoadingLikeDirective(NoResult)
export default noResultDirective
```

main.js中 use

做完以上步骤会发现报错了，报错的内容是 ncaught (in promise) DOMException: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.

点进去发现是  el.removeChild(el.instance.$el) 这行代码报的错， 这里removeChild不是它的子节点

通过debug发现 removeChild执行时，本来是要remove Loading 的，但是刚才又创建了一次noResult, 实际上el.instance.$el 是 noResult 了，本来是要移除loading这个层。因为noResult还没有创建，还没有创建到容器内，然后把noResult给删除就会报错。

在作用指令的时候，两个指令都作用到同一个元素，都给它们绑定到 el.instance 不太合适，因为同一个元素都会相继触发这个mounted, 都把 el.instance = instance，后面的会覆盖前面的，导致后续获取el.instance 是后来哪个，前面的就丢掉了。解决方法很简单，多建一维，根据传进的Comp 不同来设置

```js
import { createApp } from 'vue'
import { addClass, removeClass } from '@/assets/js/dom'
const relativeCls = 'g-relative'

export default function createLoadingLikeDirective(Comp) {
    return {
        mounted(el, binding) {
            // vue 是可以多实例的
            const app = createApp(Comp) // loading 组件
            // DOM 对象
            const instance = app.mount(document.createElement('div'))
            const name = Comp.name
            if (!el[name]) {
                el[name] = {}
            }
            // 保存起来 方便多次使用
            el[name].instance = instance
            const title = binding.arg
            if (typeof title !== 'undefined') {
                el[name].instance.setTitle(title)
            }
            if (binding.value) {
                append(el)
            }
        },
        updated(el, binding) {
            const name = Comp.name
            const title = binding.arg
            if (typeof title !== 'undefined') {
                el[name].instance.setTitle(title)
            }
            // 当 前后值不一样时
            if (binding.value !== binding.oldValue) {
                // 执行添加 或 移除 操作
                binding.value ? append(el) : remove(el)
            }
        }
    }

    function append(el) {
        // el.instance.$el  loading 组件的DOM对象
        /** 还存在一些问题 ：：
         * loading 组件要求 外层容器的定位是 'absolute', 'fixed', 'relative'
         */
        const name = Comp.name
        const style = getComputedStyle(el) // getComputedStyle 用于获取指定元素的css
        if (['absolute', 'fixed', 'relative'].indexOf(style.position) === -1) {
            addClass(el, relativeCls)
        }
        el.appendChild(el[name].instance.$el)
    }

    function remove(el) {
        const name = Comp.name
        removeClass(el, relativeCls)
        el.removeChild(el[name].instance.$el)
    }
}

```

### 4-10 歌手详情页歌曲列表点击以及 vuex 的应用

播放器在任何页面都可以显示所以是一个全局组件

index.js

```js
// 开发环境下使用 createLogger 插件 查看提交状态
import { createStore, createLogger } from 'vuex'
import mutations from './mutations'
import state from './state'
import * as getters from './getters'
import * as actions from './actions'
const debug = process.env.NODE_ENV !== 'production' // 开发环境
export default createStore({
  state,
  mutations,
  getters,
  actions,
  /*
  严格模式：当去检测state修改是不是在提交mutations的时候, 就会深度watch state,
          当state有任何变化，就会检测是不是在提交mutations，如果不是的话就会报警告，
          当人这个严格模式会有性能消耗，因为深度watch了，所以在开发环境开启
   */
  strict: debug,
  plugins: debug ? [createLogger()] : []
})

```



```js
import { PLAY_MODE } from '@/assets/js/constant'

const state = {
  sequenceList: [],
  playlist: [], // 播放列表
  playing: false, // 播放状态
  playMode: PLAY_MODE.sequence, // 播放模式
  currentIndex: 0, // 歌曲索引
  fullScreen: false // 播放器的状态
}
export default state

```

mutations.js

```js
const mutations = {
    setPlayingState(state, playing) {
        state.playing = playing
    },
    setSequenceList(state, list) {
        state.sequenceList = list
    },
    setPlaylist(state, list) {
        state.playlist = list
    },
    setPlayMode(state, mode) {
        state.playMode = mode
    },
    setCurrentIndex(state, index) {
        state.currentIndex = index
    },
    setFullScreen(state, fullScreen) {
        state.fullScreen = fullScreen
    }
}
export default mutations

```

actions.js

```js
import { PLAY_MODE } from '@/assets/js/constant'

export function selectPlay({ commit }, { list, index }) {
    commit('setPlayMode', PLAY_MODE.sequence)
    commit('setSequenceList', list)
    commit('setPlayingState', true)
    commit('setFullScreen', true)
    commit('setPlaylist', list)
    commit('setCurrentIndex', index)
}

```

getters.js

```js
export const currentSong = (state) => {
    return state.playlist[state.currentIndex] || {}
}
```

music-list.vue

```js
  selectItem({ song, index }) {
      this.selectPlay({
        list: this.songs,
        index
      })
    }
```

### 4-11 歌手详情页歌曲列表实现随机播放

随机播放是对歌曲列表进行随机算法打乱

```js
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
```

## 第五章

### 5-1 播放器基础样式及歌曲播放功能开发

### 5-2 播放器播放按钮的暂停与播放逻辑开发

### 5-3 播放器歌曲前进与后退逻辑开发

```js
export default {
  setup() {
    // data
    const audioRef = ref(null)
    // vuex
    // computed 响应式 这里的东西一旦变化 数据立马改变
    const store = useStore()
    const currentSong = computed(() => store.getters.currentSong)
    const playlist = computed(() => store.state.playlist)
    const fullScreen = computed(() => store.state.fullScreen)
    const playing = computed(() => store.state.playing)
    const playIcon = computed(() => {
      return playing.value ? 'icon-pause' : 'icon-play'
    })
    const currentIndex = computed(() => store.state.currentIndex)

    // watch
    watch(currentSong, (newSong) => {
      if (!newSong.id || !newSong.url) {
        return
      }
      const audioEl = audioRef.value
      audioEl.src = newSong.url
      audioEl.play()
    })
    watch(playing, (newPlaying) => {
      const audioEl = audioRef.value
      newPlaying ? audioEl.play() : audioEl.pause()
    })
    // methods
    function goBack() {
      store.commit('setFullScreen', false)
    }
    function togglePlay() {
      store.commit('setPlayingState', !playing.value)
    }
    function prev() {
      const list = playlist.value
      if (!list.length) { // 没有任何歌曲
        return
      }
      // 当列表只有一首歌的时候 循环播放
      if (list.length === 1) {
        loop()
      } else {
        let index = currentIndex.value - 1
        if (index === -1) { // 如果是第一页跳转到最后一页
          index = list.length - 1
        }
        store.commit('setCurrentIndex', index)
        if (!playing.value) {
          store.commit('setPlayingState', true)
        }
      }
    }
    function next() {
      const list = playlist.value
      if (!list.length) { // 没有任何歌曲
        return
      }
      let index = currentIndex.value + 1
      if (list.length === 1) {
        loop()
      } else {
        if (index === list.length) { // 如果是第一页跳转到最后一页
          index = 0
        }
        store.commit('setCurrentIndex', index)
        if (!playing.value) {
          store.commit('setPlayingState', true)
        }
      }
    }

    function loop() {
      const audioEl = audioRef.value
      audioEl.currentTime = 0
      audioEl.play()
      store.commit('setPlayingState', true)
    }
    /** 防止电脑待机状态等时候，playing 还是 true的状态 */
    function pause() {
      store.commit('setPlayingState', false)
    }
    return { currentSong, playlist, fullScreen, audioRef, goBack, playIcon, togglePlay, pause, prev, next }
  }
}
```

### 5-4 播放器 DOM 异常错误处理_

报错信息： Uncaught (in promise) DOMException: The play() request was interrupted by a new load request. https://goo.gl/LdLk22

发现是在 `      audioEl.src = newSong.url` 赋值的时候报错， 当快速点击切换歌曲的时候也会报错

解决：audio 添加 canplay事件 当歌曲有一定的缓存数据，足够播放就会触发该事件，音频的流式加载的，缓存一段数据就可以播放这一段，然后继续缓存下一段

​		@canplay="ready" 用一个标准来控制切换，不能很快就切换，不能状态一更新就播放，要等歌曲是ready的时候才去播放。

​	定义变量 songReady = ref(false)

```
songReady = ref(false)
```

```js
   function ready() {
      // 会多次缓存数据所以会多次执行 ready, 如果已经是true 直接返回
      if (songReady.value) {
        return
      }
      songReady.value = true
    }
```

当 songReady为 false的时候 retrue 出去 解决首次歌曲播放报错问题

```js
    watch(playing, (newPlaying) => {
      // 当 songReady 还是false 的时候什么都不做 解决播放报错问题
      if (!songReady.value) {
        return
      }
      const audioEl = audioRef.value
      newPlaying ? audioEl.play() : audioEl.pause()
    })

```

当歌曲变化时要处理

```js
    watch(currentSong, (newSong) => {
      if (!newSong.id || !newSong.url) {
        return
      }
      /**
       * 当切换歌曲的时候将 songReady 置为 false
       * 然后再去执行 audioEl.play()，然后歌曲去进行缓存，触发canplay事件，然后执行ready函数 将songReady 置为 true
       */
      songReady.value = false
      const audioEl = audioRef.value
      audioEl.src = newSong.url
      audioEl.play()
    })

```

当点击 next prev 时 判断 songReady状态，如果为false 不让它前进和后退

```js
      if (!songReady.value || !list.length) { // 没有任何歌曲
        return
      }

```

当按钮点击是，如果为无效点击添加 :class="disableCls"

```js
    const disableCls = computed(() => {
      return songReady.value ? '' : 'disable'
    })

```

当歌曲异常时执行error事件，不会执行canplay事件

```
<audio
      ref="audioRef"
      @pause="pause"
      @canplay="ready"
      @error="error"
    ></audio>
```

```js
    function error() {
      // 这里的作用是，如果是error 的状态，歌曲是可以前进和后退的
      songReady.value = true
    }
```

### 5-5 播放器 歌曲播放模式相关逻辑开发

```js
<i @click="changeMode" :class="modeIcon"></i>
```

前面开发播放器的歌曲切换，歌曲播放等最基础的功能。但播放模式可以理解为播放器的增强功能。 播放模式逻辑可以不在主逻辑里面写了，可以拆分成钩子函数，利用composition API 拆分到不同维护，这样的话逻辑拆分的就比较清晰了

新建 use-mode.js

```js
import { computed } from 'vue'
import { useStore } from 'vuex'
import { PLAY_MODE } from '@/assets/js/constant'

export default function useMode() {
    const store = useStore()
    const playMode = computed(() => store.state.playMode)
    const modeIcon = computed(() => {
        const playModeVal = playMode.value
        return playModeVal === PLAY_MODE.sequence ? 'icon-sequence' : (playModeVal === PLAY_MODE.random ? 'icon-random' : 'icon-loop')
    })
    function changeMode() {
        const mode = (playMode.value + 1) % 3
        console.log(mode)
        store.dispatch('changeMode', mode)
    }
    return { modeIcon, changeMode }
}
```

actions.js

这个时候发现，当点击播放模式的时候，当前正在播放的歌曲也跟着改变了，这是因为，当前播放的歌曲是根据 playList 和 currentIndex 进行索引取歌。 所以当重新洗牌时，将顺序打乱了，当是currentIndex 没有对应打乱的数据，造成歌曲被改变

```js
export function changeMode({ commit, state }, mode) {
    // 顺序播放 => 随机播放
    if (mode === PLAY_MODE.random) {
        // 洗牌
        commit('setPlaylist', shuffle(state.sequenceList))
    } else {
        commit('setPlaylist', state.sequenceList)
    }
    commit('setPlayMode', mode)
}

```

解决： 改变playList之前先去拿到当前歌曲的 id ， 先去缓存， 提交playMode 之前先要去修改 currentIndex

```js
export function changeMode({ commit, state, getters }, mode) {
    const currentId = getters.currentSong.id
    // 顺序播放 => 随机播放
    if (mode === PLAY_MODE.random) {
        // 洗牌
        commit('setPlaylist', shuffle(state.sequenceList))
    } else {
        commit('setPlaylist', state.sequenceList)
    }
    const index = state.playlist.findIndex(song => {
        return song.id === currentId
    })
    commit('setCurrentIndex', index)
    commit('setPlayMode', mode)
}

```

### 5-6 5-7 播放器 歌曲收藏功能相关逻辑开发（1）

收藏的歌曲是多个的，所以是一个列表，当刷新页面时还能够知道那些歌曲被收藏。还有收藏和非收藏之间的切换。

state.js 里面添加

```js
const state = {
  favoriteList: []
}
```

对应的 mutations.js

```js
    setFavoriteList(state, list) {
        state.favoriteList = list
    }
```

为了代码的可维护性，新建 use-favorite.js 钩子

收藏歌曲或未来会一些逻辑是类似的，所以抽离出来， assets/js/array-store.js

```js
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
    if (index > 1) {
        return
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
```

use-favorite

```js
import { computed } from 'vue'
import { useStore } from 'vuex'
import { save, remove } from '@/assets/js/array-store'
import { FAVORITE_KEY } from '@/assets/js/constant'
export default function useFavorite() {
    // data
    const maxLen = 100

    // vuex
    const store = useStore()
    const favoriteList = computed(() => store.state.favoriteList)

    // methods
    /** 判断歌曲是否存在 favoriteList 中 */
    function getFavoriteIcon(song) {
        console.log(isFavorite(song))
        return isFavorite(song) ? 'icon-favorite' : 'icon-not-favorite'
    }
    /** 收藏或删除歌曲 */
    function toggleFavorite(song) {
        let list
        if (isFavorite(song)) {
            list = remove(FAVORITE_KEY, compare)
        } else {
            list = save(song, FAVORITE_KEY, compare, maxLen)
        }
        store.commit('setFavoriteList', list)

        /**
         * 下面的findIndex 可以让开发人员自定义传参数compare，可以传id,也可以传mid
         * 所以可以利用这点，可以传入一个compare函数，这个compare函数的具体实现是在外部实现的
         * 对于这个库而言，只要支持用户可以传入一个compare函数，不用关心具体的实现细节，这个细节是外部来决定的
         * 只管调用就行了，相当于将这部分的逻辑剥离出去耦合了
        */
        function compare(item) {
            return item.id === song.id
        }
    }

    function isFavorite(song) {
        return favoriteList.value.findIndex((item) => {
            return item.id === song.id
        }) > -1
    }
    return { getFavoriteIcon, toggleFavorite }
}

```

当页面加载时，将本地的值赋给  favoriteList

```
favoriteList: load(FAVORITE_KEY) // 已收藏的列表
```

### 5-8 播放器 进度条相关逻辑开发（上）

基础骨架

```js
<template>
  <div class="progress-bar" @click="onClick">
    <div class="bar-inner">
      <div class="progress" ref="progress"></div>
      <div class="progress-btn-wrapper">
        <div class="progress-btn"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    onclick() {
    }
  }
}
</script>

<style lang="scss" scoped>
.progress-bar {
  height: 30px;
  .bar-inner {
    position: relative;
    top: 13px;
    height: 4px;
    background: rgba(0, 0, 0, 0.3);
    .progress {
      position: absolute;
      height: 100%;
      background: $color-theme;
    }
    .progress-btn-wrapper {
      position: absolute;
      left: -8px;
      top: -13px;
      width: 30px;
      height: 30px;
      .progress-btn {
        position: relative;
        top: 7px;
        left: 7px;
        width: 16px;
        box-sizing: border-box;
        height: 16px;
        border: 3px solid $color-text;
        border-radius: 50%;
        background: $color-theme;
      }
    }
  }
}
</style>

```

```js
const progressBtnWidth = 16

export default {
  props: {
    progress: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      offset: 0
    }
  },
  watch: {
    progress(newProgress) {
      this.setOffset(newProgress)
    }
  },
  computed: {
    progressStyle() {
      return `width:${this.offset}px`
    },
    btnStyle() {
      return `transform:translate3d(${this.offset}px,0,0)`
    }
  },
  methods: {
    onclick() {
    },
    setOffset(progress) {
      const barWidth = this.$el.clientWidth - progressBtnWidth
      this.offset = barWidth * progress
    }
  }
}
```

当音频开始播放时，会触发@timeupdate事件

```
@timeupdate="updateTime"
```

```js
    function updateTime(e) {
      currentTime.value = e.target.currentTime
    }
```

此时的 currentTime的数据未格式化

util.js 里面定义工具函数

```js
export function formatTime(interval) {
    interval = interval | 0 // 向下取整
    const minute = ((interval / 60 | 0) + '').padStart(2, '0')
    const second = (interval % 60 + '').padStart(2, '0')
    return `${minute}:${second}`
}
```

按钮滚动

```js
 btnStyle() {
      return `transform:translate3d(${this.offset}px,0,0)`
    }
```

```js
 setOffset(progress) {
      const barWidth = this.$el.clientWidth - progressBtnWidth // 204
      this.offset = barWidth * progress
    },
```

```js
    setOffset(progress) {
      const barWidth = this.$el.clientWidth - progressBtnWidth // 减去按钮的16 === 204
      this.offset = barWidth * progress // 转化百分比
      console.log(`${barWidth} * ${progress}`)
    },
```

### 5-9播放器 进度条相关逻辑开发（下）

当拖动时或者点击时进度条时，歌曲发生进度变化

添加事件

```html
<div
          class="progress-btn"
          @touchstart.prevent="onTouchStart"
          @touchmove.prevent="onTouchMove"
          @touchend.prevent="onTouchEnd"
        ></div>
```

当手指刚刚触摸的X轴减去手指滑动时的距离，求出距离后，同时在手指刚刚触摸的时候拿到黄色条的初始宽度 beginWidth, 

onTouchMove的过程中，拿到将 X 轴减 去 onTouchStatrt的 X 轴，拿到偏移量。偏移量再加上黄色进度条的宽度。然后拿到区间  `const progress = Math.min(1, Math.max(tempWidth / barWidth, 0))`

`this.offset = barWidth * progress` 滑动同时改变进度条进度

onTouchEnd 当滑动结束时，拿到 barWidth ，用黄色进度条 减去 barWidth，然后向外抛出事件

```js
 onTouchStart(e) {
      this.touch.x1 = e.touches[0].pageX
      this.touch.beginWidth = this.$refs.progress.clientWidth // 黄色条初始化宽度
    },
    onTouchMove(e) {
      const delta = e.touches[0].pageX - this.touch.x1 // 偏移
      const tempWidth = this.touch.beginWidth + delta // 位移过后 + 黄色条的宽度
      const barWidth = this.$el.clientWidth - progressBtnWidth // 整个进度条的宽度
      const progress = Math.min(1, Math.max(tempWidth / barWidth, 0)) // 0 - 1 区间
      this.offset = barWidth * progress
      this.$emit('progress-changing', progress) // 手指未离开
    },
    onTouchEnd() {
      const barWidth = this.$el.clientWidth - progressBtnWidth
      const progress = this.$refs.progress.clientWidth / barWidth
      this.$emit('progress-changed', progress)
    }
```

player.vue

监听事件

```js
  function onProgressChanging(progress) {
      currentTime.value = currentSong.value.duration * progress
    }
    function onProgressChanged(progress) {
      // 当收松开 再去修改audio的时间
      audioRef.value.currentTime = currentTime.value = currentSong.value.duration * progress
      // 如果当时歌曲是暂停的让它播放
      if (!playing.value) {
        store.commit('setPlayingState', true)
      }
    }
```

此时存在问题。在播放过程中拖动，进度条会拖动不了的异常。

分析：在 onProgressChanging() 修改了 currentTime，但是currentTime 一旦发生改变的话，progress是一个computed 会根据currentTime 做一个新的计算，一旦计算之后progress值传到 `progress-bar.vue`组件里面，会watch到progress的变化，它内部也会进行计算，根据 barWidth * newProress 重新计算

所以 在 onProgressChanging() 虽然修改的 currentTime 发生变化，会将进度条改变为对应的位置，由于歌曲正在播放过程中，实际上有一个updateTime 这里的 currentTime 仍然在修改。所以两边在同时修改，onProgressChanging这里修改了，但 updateTime 又将值修改回去了。所以进度条会来回跳

解决：在updateTime 做一层控制

```js
  function updateTime(e) {
      if (!progressChanging) {
        currentTime.value = e.target.currentTime
      }
    }
    function onProgressChanging(progress) {
      progressChanging = true
      currentTime.value = currentSong.value.duration * progress
    }
    function onProgressChanged(progress) {
      progressChanging = false
      // 当收松开 再去修改audio的时间
      audioRef.value.currentTime = currentTime.value = currentSong.value.duration * progress
      // 如果当时歌曲是暂停的让它播放
      if (!playing.value) {
        store.commit('setPlayingState', true)
      }
    }
```

点击功能

分析： 通过 getBoundingClientRect 获取得该元素在距离页面左侧的距离 减去 pageX 得到偏移量

```js
onClick(e) {
      // getBoundingClientRect用于获得页面中某个元素的左，上，右和下分别相对浏览器视窗的位置。
      const rect = this.$el.getBoundingClientRect()
      const offsetWidth = e.pageX - rect.left
      const barWidth = this.$el.clientWidth - progressBtnWidth
      const progress = offsetWidth / barWidth
      this.$emit('progress-changed', progress)
    },
```

### 5-10 播放器 cd 唱片旋转相关逻辑开发

当 img 转动的时候， cd 是有一个角度的，所以当停止是时要 concat 两个角度

```js
   function syncTransform(wrapper, inner) {
        // 外层同步内层
        const wrapperTransform = getComputedStyle(wrapper).transform
        const innerTransform = getComputedStyle(inner).transform
        wrapper.style.transform = wrapperTransform === 'none' ? innerTransform : innerTransform.concat(' ', wrapperTransform)
    }
    return { cdCls, cdRef, cdImageRef }
```

### 5-11 播放器 歌词相关逻辑开发（01）

后端要通过base64解码，所以要 npm

song.js

当前歌曲发生变化的时候调用该接口

```js
export function getLyric(song) {
    const mid = song.mid

    return get('api/getLyric', {
        mid
    }).then(result => {
        const lyric = result ? result.lyric : '[00:00:00]该歌曲暂无法获取歌词'
        return lyric
    })
}
```

处理歌曲相关的钩子 use-lyric.js

use-lyric.js

```js
import { computed, watch } from 'vue'
import { useStore } from 'vuex'
import { getLyric } from '../../service/song'

export default function useLyric() {
    const store = useStore()
    const currentSong = computed(() => store.getters.currentSong)
    watch(currentSong, async (newSong) => {
        if (!newSong.url || !newSong.id) {
            return
        }
        const lyric = await getLyric(newSong)
        console.log(lyric)
    })
}
```

当点击切换歌曲时，是可以做歌曲歌词的缓存的，当下一次切换时就不用去就行网络请求了

```js
const lyricMap = {}

export function getLyric(song) {
    // 如果存在歌词就直接return
    console.log(lyricMap)
    if (song.lyric) {
        return Promise.resolve(song.lyric)
    }
    const mid = song.mid
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
    }).then(result => {
        const lyric = result ? result.lyric : '[00:00:00]该歌曲暂无法获取歌词'
        lyricMap[mid] = lyric
        console.log('发送了http请求歌词')
        return lyric
    })
}

```

使用 lyric-parser 解析歌词

```js
import { computed, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { getLyric } from '../../service/song'
import Lyric from 'lyric-parser'

export default function useLyric() {
    const currentLyric = ref(null)
    const store = useStore()
    const currentSong = computed(() => store.getters.currentSong)
    watch(currentSong, async (newSong) => {
        if (!newSong.url || !newSong.id) {
            return
        }
        const lyric = await getLyric(newSong)
        store.commit('addSongLyric', {
            song: newSong,
            lyric
        })
        /**
         * 注意 getLyric 是个异步的过程是有网络延迟的，如果一首歌曲，比如说a切换到b这个时候 b在 getLyric过程中
         * 又从b切到了c, 那么之前b getLyric 返回的逻辑都不用执行了，所以需要做一个判断
         */
        if (currentSong.value.lyric !== lyric) {
            return
        }
        currentLyric.value = new Lyric(lyric, handleLyric)
    })
}
/** 当歌词切换过程中触发 */
function handleLyric() {
}
```

### 5-12 播放器 歌词相关逻辑开发（02）

当播放音乐的时候，歌词并没有反应，因为这里虽然实例化了，但是没有触发，什么时触发？可以在音乐播放后触发

调用插件 api seek 实现歌词高亮

```js
        /** 这里虽然实例化了 但是没有播放 什么时候播放呢，可以在实例化后播放
         * 但是这里判断，注意这里有两个异步过程 currentSong变化 和 歌曲播放的canplay 触发的 ready 也是一个异步过程
         * 所以要判断 songReady 是否为 true ，为true时证明已经开始播放这时去触发实例播放才有意思
         */
        currentLyric.value = new Lyric(lyric, handleLyric)
        if (songReady.value) {
            playLyric()
        }
    function playLyric() {
        const currentLyricVal = currentLyric.value
        if (currentLyricVal) {
            currentLyricVal.seek(currentTime.value * 1000)
        }
    }
```

当歌词下一句的时候为什么会高亮？

当实例化后会触发 handleLyric函数 这个函数是歌词切换的过程中触发的

lineNum 是当前的行号

```js
 /** 当歌词切换过程中触发 */
    function handleLyric({ lineNum, txt }) {
        // lineNum 当前行号
        currentLineNum.value = lineNum
        // 因为 lyricListRef 是组件实例所以 加上 Comp
        const scrollComp = lyricScrollRef.value
        // DOM 实例 加上 El
        const listEl = lyricListRef.value
        // 如果没有这个列表就 return
        if (!listEl) {
            return
        }
        if (lineNum > 5) {
            // 保持歌词居中的位置
            const lineEl = listEl.children[lineNum - 5]
            scrollComp.scroll.scrollToElement(lineEl, 1000)
        } else {
            scrollComp.scroll.scrollTo(0, 0, 1000)
        }
    }
```

以上可以实现歌曲的高亮过程，但是歌词并没有随着歌曲的进行而滚动，所以要在scroll组件里面作文章

添加 ref="lyricScrollRef"  ref="lyricListRef"

```js
    const lyricScrollRef = ref(null)
    const lyricListRef = ref(null)
```

当歌词切换过程中 让歌词滚动

如果 listEl 是 false 的话 可能是没有歌词，就return 出去

如果 lineNum > 5 让歌词保持在居中的位置，如果小于5 则滚动到顶部

```js
 /** 当歌词切换过程中触发 */
    function handleLyric({ lineNum, txt }) {
        // lineNum 当前行号
        currentLineNum.value = lineNum
        // 因为 lyricListRef 是组件实例所以 加上 Comp
        const scrollComp = lyricScrollRef.value
        // DOM 实例 加上 El
        const listEl = lyricListRef.value
        // 如果没有这个列表就 return
        if (!listEl) {
            return
        }
        if (lineNum > 5) {
            // 保持歌词居中的位置
            const lineEl = listEl.children[lineNum - 5]
            scrollComp.scroll.scrollToElement(lineEl, 1000)
        } else {
            scrollComp.scroll.scrollTo(0, 0, 1000)
        }
    }
```

这时当歌曲停止时，歌词仍然在滚动，这是因为歌词和歌曲之间的播放没有关联起来，要监听playing 的变化，如果说歌曲播放到暂停的状态，歌词也要做相应的暂停

```js
 /** 停止歌曲滚动 */
    function stopLyric() {
        const currentLyricVal = currentLyric.value
        if (currentLyricVal) {
            currentLyricVal.stop()
        }
    }
```

当watch playing 变化的时候 就 停止 或者 滚动

```js
watch(playing, (newPlaying) => {
      // 当 songReady 还是false 的时候什么都不做 解决播放报错问题
      if (!songReady.value) {
        return
      }
      const audioEl = audioRef.value
      if (newPlaying) {
        audioEl.play()
        playLyric()
      } else {
        audioEl.pause()
        // 因为当歌曲暂停时，歌词还没有暂停，这里要同时暂停歌词 做到同步
        stopLyric()
      }
    })
```

当去拖动进度条的时候，歌曲并没有变化，这时拖动进度条的时候时间是随着进度拖动，歌词也随着滚动

```js
  function onProgressChanging(progress) {
      progressChanging = true
      currentTime.value = currentSong.value.duration * progress
      // 正在拖动的过程中 先play 同步到当前的位置 再stop 因为changing的时候是不需要变化的
      playLyric()
      stopLyric()
    }
    function onProgressChanged(progress) {
      progressChanging = false
      // 当收松开 再去修改audio的时间
      audioRef.value.currentTime = currentTime.value = currentSong.value.duration * progress
      // 如果当时歌曲是暂停的让它播放
      if (!playing.value) {
        store.commit('setPlayingState', true)
      }
      // 当 拖动结束时 播放歌词
      playLyric()
    }
```

当歌曲来回切换时，歌词会来回跳动

分析：在currentSong 切换的过程中 currentlyric是存在的，如果之前创建过currentLyric 它是存在的。所以要在切换的时候stop掉

```js
watch(currentSong, async (newSong) => {
        if (!newSong.url || !newSong.id) {
            return
        }
        stopLyric()
        const lyric = await getLyric(newSong)
        ....
    })
```

这时还是会出问题，虽然 stopLyric() 了 ，说明上一首歌已经stopLyric 了， 这时候监听 currentSong 了 切换到下一首歌，然后下一首歌会去加载歌曲，同时去加载歌词，假设歌词还没有加载完，还没有去创建一个新的 Lyric实例，所以虽然执行了 stopLyric（） 但是还是上一首歌，还在加载歌词的过程中，然后这个时候触发 ready() , 下一首歌已经ready了 但是歌词还没有好，就执行playLyric() ，这时执行的playLyric（）指向的还是前一个，就是播放前一个的 Lyric, 就会有来回跳的情况， 所以再做一层清理

```
currentLyric.value = null
currentLineNum.value = 0
```

### 5-13 播放器 歌词相关逻辑开发（03

处理纯音乐的情况

```html
 <div class="pure-music" v-show="pureMusicLyric">
              <p>{{ pureMusicLyric }}</p>
            </div>
```

当去实例化 Lyric 的时候，去判断 歌曲的长度，如果有长度的话，就有歌词

```js
 currentLyric.value = new Lyric(lyric, handleLyric)
        const hasLyric = currentLyric.value.lines.length
        if (hasLyric) {
            if (songReady.value) {
                playLyric()
            }
        } else {
            pureMusicLyric.value = lyric.replace(/\[(\d{2}):(\d{2}):(\d{2})\]/g, '') // 这里的作用是 截取掉[00:00:00]
        }
```

当前播放的文案

```html
 <div class="playing-lyric-wrapper">
            <div class="playing-lyric">{{ playingLyric }}</div>
          </div>
```

当歌曲播放的过程中赋值

```
 function handleLyric({ lineNum, txt }) {
         playingLyric.value = txt
}
```

```
处理边界问题
        pureMusicLyric.value = ''
```

### 5-14 播放器 中间视图层手指交互相关逻辑开发（上

歌词和 CD视图层相互滑动，滑动过程中，透明度会发生改变，底部有会白点对应的视图层，当滑动到百分之20这样就可以实现滑动视图，并不需要滑动的特别多，也符合用户的需求

```html
<div class="dot-wrapper">
            <span class="dot" :class="{ active: currentShow === 'cd' }"></span>
            <span
              class="dot"
              :class="{ active: currentShow === 'lyric' }"
            ></span>
          </div>
```

中间层的逻辑也单独提出

计算位移，根据当前的屏幕不同就有不同的初始值，比如当前的view是一个cd, 一开始的初始值就是0，如果当前的view是lyric，那它的位移就是整个屏幕的宽度，所以要根据当前的视图来做判断

定义变量

```
  // data
    const currentShow = ref('cd')
    const middleLStyle = ref(null)
    const middleRStyle = ref(null)
```

手指数据

```
 const touch = {}
 let currentView = 'cd'
```

```js
  // methods
    function onMiddleTouchStart(e) {
        touch.startX = e.touches[0].pageX
    }
    function onMiddleTouchMove(e) {
        const deltaX = e.touches[0].pageX - touch.startX
        // 如果 currentView === 'lyric' 则它的初始值为负的 window.innerWidth
        const left = currentView === 'cd' ? 0 : -window.innerWidth
        const offsetWidth = Math.min(0, Math.max(-window.innerHeight, left + deltaX))
        console.log(offsetWidth)
        touch.percent = Math.abs(offsetWidth / window.innerWidth) // abs 返回绝对值
        if (currentView === 'cd') {
            if (touch.percent > 0.2) {
                currentShow.value = 'lyric'
            } else {
                currentShow.value = 'cd'
            }
        } else {
            if (touch.percent < 0.8) {
                currentShow.value = 'cd'
            } else {
                currentShow.value = 'lyric'
            }
        }
        middleLStyle.value = {
            opacity: 1 - touch.percent,
            transitionDuration: '0ms'
        }

        middleRStyle.value = {
            transform: `translate3d(${offsetWidth}px, 0, 0)`,
            transitionDuration: '0ms'
        }
    }
    function onMiddleTouchEnd() {
        let offsetWidth
        let opacity
        if (currentShow.value === 'cd') {
            currentView = 'cd'
            offsetWidth = 0
            opacity = 1
        } else {
            currentView = 'lyric'
            offsetWidth = -window.innerWidth
            opacity = 0
        }

        const duration = 300
        middleLStyle.value = {
            opacity,
            transitionDuration: `${duration}ms`
        }

        middleRStyle.value = {
            transform: `translate3d(${offsetWidth}px, 0, 0)`,
            transitionDuration: `${duration}ms`
        }
    }
```

### 5-15 播放器 中间视图层手指交互相关逻辑开发（下）

解决斜着也可以滑动的问题

分析：本身这个歌词列表是支持纵向滑动的，better-scroll有一个方向锁，可以锁定一个滑动方向，这里的需求是锁定横向滑动

```js
  function onMiddleTouchStart(e) {
        touch.startX = e.touches[0].pageX
        touch.startY = e.touches[0].pageY
        touch.directionLocked = ''
    }
```

```js
 function onMiddleTouchMove(e) {
        const deltaX = e.touches[0].pageX - touch.startX
        const deltaY = e.touches[0].pageY - touch.startY

        const absDeltaX = Math.abs(deltaX)
        const absDeltaY = Math.abs(deltaY)
        if (!touch.directionLocked) {
            touch.directionLocked = absDeltaX >= absDeltaY ? 'h' : 'v'
        }
        if (touch.directionLocked === 'v') {
            return
        }
    }
```

### 5-16 播放器 mini 播放器开发（01）

基础样式

```js
<template>
  <transition name="mini">
    <div class="mini-player" v-show="!fullScreen" @click="showNormalPlayer">
      <div class="cd-wrapper">
        <div class="cd" ref="cdRef">
          <img
            ref="cdImageRef"
            width="40"
            height="40"
            :src="currentSong.pic"
            :class="cdCls"
          />
        </div>
      </div>
      <div>
        <h2 class="name">{{ currentSong.name }}</h2>
        <p class="desc">{{ currentSong.singer }}</p>
      </div>
    </div>
  </transition>
</template>
```

cd 旋转可以复用 useCd 钩子的逻辑

```
    const { cdCls, cdRef, cdImageRef } = useCd()
```

min 播放器的出入场动画

```css
 &.mini-enter-active,
  &.mini-leave-active {
    transition: all 0.6s cubic-bezier(0.45, 0, 0.55, 1);
  }
  &.mini-enter-from,
  &.mini-leave-to {
    opacity: 0;
    transform: translate3d(0, 100%, 0);
  }
```

### 5-17 播放器 mini 播放器开发（02）

点击按钮可以暂停或者播放歌曲，按钮外层还有一个圈，表示播放进度，这里是用svg实现的，具体实现看视频

progress-circle.vue 

```vue
<template>
  <div class="progress-circle">
    <svg
      :width="radius"
      :height="radius"
      viewBox="0 0 100 100"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        class="progress-background"
        r="50"
        cx="50"
        cy="50"
        fill="transparent"
      />
      <circle
        class="progress-bar"
        r="50"
        cx="50"
        cy="50"
        fill="transparent"
        :stroke-dasharray="dashArray"
        :stroke-dashoffset="dashOffset"
      />
    </svg>
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'progress-circle',
  props: {
    radius: {
      type: Number,
      default: 100
    },
    progress: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      dashArray: Math.PI * 100
    }
  },
  computed: {
    dashOffset() {
      return (1 - this.progress) * this.dashArray
    }
  }
}
</script>

<style lang="scss" scoped>
.progress-circle {
  position: relative;
  circle {
    stroke-width: 8px;
    transform-origin: center;
    &.progress-background {
      transform: scale(0.9);
      stroke: $color-theme-d;
    }
    &.progress-bar {
      transform: scale(0.9) rotate(-90deg);
      stroke: $color-theme;
    }
  }
}
</style>

```

### 5-18 播放器 mini 播放器开发（03）

当我们点击暂停mini播放器，再进入播放器页面发现进度条失效了

分析：progressStyle 是依赖 offset 计算的，但是这个offset 会 watch, progress 动态更新的，这个 watch里面会有问题

```js
// watch
progress(newProgress) {
      this.setOffset(newProgress)
    }
// methods
setOffset(progress) {
      const barWidth = this.$el.clientWidth - progressBtnWidth // 减去按钮的16 === 204
      this.offset = barWidth * progress // 转化百分比
    },
```

这里的 barWidth 依赖于 DOM api this.$el.clientwidth, 这个 progress 是一直更新的，但是 fullScreen 为 false 的时候也就是 mini播放器显示的时候，那么 normal-player 为 display:none, 那么这个情况下去调用 DOM api 去计算 clienWidth 肯定是不对的，所以offset 值也是不对的

所以当 normal-player 为 true 的时候再去计算一次 注意 要等待DOM渲染完毕才能获取 使用 nextTick

```js
watch(fullScreen, async (newFullScreen) => {
      if (newFullScreen) {
        await nextTick()
        barRef.value.setOffset(progress.value)
      }
    })
```

### 5-19 播放器 mini 播放器开发（04）

mini 支持手指滑动切换歌曲功能

分析：渲染歌曲列表，通过better-scroll 渲染歌曲，通过index对应当前那首歌

修改样式

```html
<div class="slider-wrapper">
        <div class="slider-group">
          <div class="slider-page" v-for="song in playlist" :key="song.id">
            <h2 class="name">{{ song.name }}</h2>
            <p class="desc">{{ song.singer }}</p>
          </div>
        </div>
      </div>
```

新的钩子 use-mini-slider

```js
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useStore } from 'vuex'
import BScroll from '@better-scroll/core'
import Slide from '@better-scroll/slide'

BScroll.use(Slide)
export default function useMiniSlider() {
    const sliderWrapperRef = ref(null)
    const slider = ref(null)

    const store = useStore()
    const fullScreen = computed(() => store.state.fullScreen)
    const playlist = computed(() => store.state.playlist)
    const currentIndex = computed(() => store.state.currentIndex)
    const sliderShow = computed(() => {
        return !fullScreen.value && !!playlist.value // !! 强制转换为布尔类型
    })

    onMounted(() => {
        let sliderVal
        watch(sliderShow, async (newSliderShow) => {
            if (newSliderShow) {
                await nextTick() // 等待DOM渲染完 如果没有DOM数据 那么 new BScroll 没有意义
                if (!sliderVal) {
                    // 只执行一次
                    sliderVal = slider.value = new BScroll(sliderWrapperRef.value, {
                        click: true, // 配置意思参照官网
                        scrollX: true,
                        scrollY: false,
                        momentum: false,
                        bounce: false,
                        probeType: 2,
                        slide: {
                            autoplay: false, // 禁止自动播放
                            loop: true
                        }
                    })
                    console.log(sliderVal)
                    // 触发时机：当 slide 切换 page 之后触发
                    sliderVal.on('slidePageChanged', ({ pageX }) => {
                        store.commit('setCurrentIndex', pageX)
                        store.commit('setPlayingState', true)
                    })
                } else {
                    sliderVal.refresh()
                }
                // 滚动到对应的歌曲
                sliderVal.goToPage(currentIndex.value, 0, 0)
            }
        })
        watch(currentIndex, async (newIndex) => {
            if (sliderVal && sliderShow.value) {
                await nextTick()
                sliderVal.goToPage(newIndex, 0, 0)
            }
        })
    })
    onUnmounted(() => {
        if (slider.value) {
            slider.value.destroy()
        }
    })
    return { slider, sliderWrapperRef }
}

```

### 5-20 播放器 全屏切换过渡效果实现（上）

当切换时，从 min CD 到 player 的 CD 有一个从小到大的变化和位移，当在player 点击 back 图标的时候有从上到下的位移，大CD 变为小 CD，播放器按钮有从下到上或者从上到下的位移

```
<transition name="normal">...<transition/>
```

```scss
&.normal-enter-active,
    &.normal-leave-active {
      transition: all 0.6s;
      .top,
      .bottom {
        transition: all 0.6s cubic-bezier(0.45, 0, 0.55, 1);
      }
    }
    &.normal-enter-from,
    &.normal-leave-to {
      opacity: 0;
      .top {
        transform: translate3d(0, -100px, 0);
      }
      .bottom {
        transform: translate3d(0, 100px, 0);
      }
    }
  }
```

使用 JavaScript Hooks 钩子 不用css，用js来实现动画效果

使用 `create-keyframe-animation` 库

* 首先获取CD位置，如果从大CD中间的位置，变到左下角的小CD位置，有X，Y轴的偏移量，X轴相当于二分之一屏幕宽度减去小的 CD 圆心到左边的距离。Y轴：整个屏幕的高度减去圆心到顶部的位置，再减去圆心到底部的偏移
* 所以要获取 小的CD 左边和底边的偏移等

```css
<transition
      name="normal"
      @enter="enter"
      @after-enter="afterEnter"
      @leave="leave"
      @after-leave="afterLeave"
    >
```



```js
import { ref } from 'vue'
import animations from 'create-keyframe-animation'

export default function useAnimation() {
    const cdWrapperRef = ref(null)
    function enter(el, done) {
        // el 对应的DOM
        // done: 通过js去做动画，vue内部是不知道什么时候动画结束的，所以需要你来告诉它
        const { x, y, scale } = getPosAndScale()
        const animation = {
            0: {
                // -147.5 407 0.1333333...
                transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`
            },
            100: {
                transform: 'translate3d(0, 0, 0) scale(1)'
            }
        }
        // 注册动画
        animations.registerAnimation({
            name: 'move',
            animation,
            presets: {
                duration: 600, // 时长
                easing: 'cubic-bezier(0.45, 0, 0.55, 1)' // 缓动效果
            }
        })
        /**
         * 参数： DOM 、动画名称
         * 调用 done 说明结束了 进入 afterEnter
         */
        animations.runAnimation(cdWrapperRef.value, 'move', done)
    }
    function afterEnter() {
        // 清理操作
        animations.unregisterAnimation('move')
        cdWrapperRef.value.animation = ''
    }
    function leave(el, done) {
        const { x, y, scale } = getPosAndScale()
        const cdWrapperEl = cdWrapperRef.value
        cdWrapperEl.style.transition = 'all .6s cubic-bezier(0.45, 0, 0.55, 1)'
        cdWrapperEl.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
        cdWrapperEl.addEventListener('transitionend', next) // 触发 transition 结束事件

        function next() {
            // 解绑 其实vue 内部也会有这样的逻辑，也就是为什么vue 会知道动画什么时候结束，也是调用了这些API
            // 所以要经常考虑如果绑定了一个事件，那么什么时候解绑掉 如果不解绑有可能导致内存泄漏
            cdWrapperEl.removeEventListener('transitionend', next)
            done() // 告诉vue已经结束动画
        }
    }
    function afterLeave() {
        const cdWrapperEl = cdWrapperRef.value
        cdWrapperEl.style.transition = ''
        cdWrapperEl.style.transform = ''
    }
    function getPosAndScale() {
        const targetWidth = 40
        const paddingLeft = 40 // min CD 的 r 20 + 距离左边的距离 20 = 40
        const paddingBottom = 30
        const paddingTop = 80 // 大 CD 距离顶部距离
        const width = window.innerWidth * 0.8 // 大 CD 的宽度 屏幕宽度的百分之80
        const x = -(window.innerWidth / 2 - paddingLeft) // x 偏移量 往左偏移是负值
        // 667 - 80 - 300 / 2 - 30
        const y = window.innerHeight - paddingTop - width / 2 - paddingBottom
        const scale = targetWidth / width
        console.log(x, y, scale)
        return { x, y, scale }
    }
    return { enter, afterEnter, leave, afterLeave, cdWrapperRef }
}

```

### 5-21 播放器 全屏切换过渡效果实现（下）

当把动画改为两秒时测试，enter动画还没有结束的时候去触发 Leave动画，导致动画失效

分析：是因为enter 是一个异步过程，然后执行动画 registerAnimation 它是有一个时长的为两秒，在这个两秒内，也就是这个动画还没有完成的时候，又去触发leave，这时又会对css进行一些修改，这样会导致 runAnimation 事件不会执行，所以 done 也不会执行，导致 afterEnter() 不执行，这样就乱掉了

​		相应的是在 leave 的时候，它的过渡动画也需要执行时间，如果在 leave 的过程中又去触发 enter，那么afterLeave 也不会执行，也会导致乱掉，这就是出生bug的原因

定义变量

```
   // 这里不用响应式，因为不需要关心它们的变化，只是标志位
    let entering = false
    let leaving = false
```

当执行到enter时将 entering = true, 当执行到 afterEnter 时 将 entering = false,然后执行判断，如果当前的 enter 还没有执行完毕，就马上去执行 leave 时，进行判断， 如果 entering 为 false的话，说明 afterEnter 还没有执行，需要手动调用，相反即可，保证严谨性

```js
 function enter(el, done) {
        if (leaving) {
            afterLeave()
        }
      entering = true
        .....
 }
     function afterEnter() {
        entering = false
        // 清理操作
        animations.unregisterAnimation('move')
        cdWrapperRef.value.animation = ''
    }
    
    function leave(el, done) {
        // 如果 entering 还是为true 就手动触发 afterEnter()
        if (entering) {
            afterEnter()
        }
        leaving = true
	}
    function afterLeave() {
        leaving = false
}
```

### 5-22 播放器 播放列表组件实现（01）

这里复用了 useMode 和 useFavorite 的钩子

注意：又出现了 scroll 不能滚动的问题， 因为 初始化 scroll组件的时候，这个时候去没有去渲染歌曲列表的，也就是 scroll 实例化的时候，这个页面并没有渲染，所以计算不对，这也是我们封装 scroll 组件经常遇到的问题

解决： 执行 scroll 的 refresh 方法， 注意要在 DOM 渲染完毕时调用，否则无效，也就是 nextTick(),

这里依赖DOM 所以要等待 DOM 渲染完毕 才能计算

```vue
<template>
  <!-- 该组件渲染到body上 合适于全屏类的 有弹层类的组件 -->
  <teleport to="body">
    <transition name="list-fade">
      <div class="playlist" v-show="visible && playlist.length" @click="hide">
        <div class="list-wrapper">
          <div class="list-header">
            <h1 class="title">
              <i class="icon" :class="modeIcon" @click.stop="changeMode"> </i>
              <span class="text">{{ modeText }}</span>
              <span class="clear">
                <i class="icon-clear"></i>
              </span>
            </h1>
          </div>
          <scroll ref="scrollRef" class="list-content">
            <ul>
              <li class="item" v-for="song in sequenceList" :key="song.id">
                <i class="current" :class="getCurrentIcon(song)"></i>
                <span class="text">{{ song.name }}</span>
                <span class="favorite" @click.stop="toggleFavorite(song)">
                  <i :class="getFavoriteIcon(song)"></i>
                </span>
              </li>
            </ul>
          </scroll>
          <div class="list-footer" @click="hide">
            <span>关闭</span>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script>
import Scroll from '@/components/base/scroll/scroll'
import { ref } from '@vue/reactivity'
import { useStore } from 'vuex'
import { computed, nextTick } from '@vue/runtime-core'
import useMode from './use-mode'
import useFavorite from './use-favorite'
export default {
  components: {
    Scroll
  },
  setup() {
    // data
    const visible = ref(false)
    const scrollRef = ref(null)
    const store = useStore()
    // computed
    const currentSong = computed(() => store.getters.currentSong)
    const playlist = computed(() => store.state.playlist)
    const sequenceList = computed(() => store.state.sequenceList)

    // hoots
    const { modeIcon, changeMode, modeText } = useMode()
    const { getFavoriteIcon, toggleFavorite } = useFavorite()
    // methods
    async function show() {
      await nextTick()
      refreshScroll() // 这里依赖DOM 所以要等待 DOM 渲染完毕 才能计算
      visible.value = true
    }

    function hide() {
      visible.value = false
    }

    function getCurrentIcon(song) {
      if (song.id === currentSong.value.id) {
        return 'icon-play'
      }
    }

    function refreshScroll() {
      // 重新计算
      scrollRef.value.scroll.refresh()
    }
    return {
      // data
      visible,
      scrollRef,
      // computed
      playlist,
      sequenceList,
      currentSong,
      // methods
      show,
      hide,
      refreshScroll,
      getCurrentIcon,
      // useMode
      modeIcon,
      changeMode,
      modeText,
      // useFavorite
      getFavoriteIcon,
      toggleFavorite
    }
  }
}
</script>

<style lang="scss" scoped>
.playlist {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  z-index: 200;
  background-color: $color-background-d;
  &.list-fade-enter-active,
  &.list-fade-leave-active {
    transition: opacity 0.3s;
    .list-wrapper {
      transition: all 0.3s;
    }
  }
  &.list-fade-enter-from,
  &.list-fade-leave-to {
    opacity: 0;
    .list-wrapper {
      transform: translate3d(0, 100%, 0);
    }
  }
  .list-wrapper {
    position: fixed;
    left: 0;
    bottom: 0;
    z-index: 210;
    width: 100%;
    background-color: $color-highlight-background;
    .list-header {
      position: relative;
      padding: 20px 30px 10px 20px;
      .title {
        display: flex;
        align-items: center;
        .icon {
          margin-right: 10px;
          font-size: 24px;
          color: $color-theme-d;
        }
        .text {
          flex: 1;
          font-size: $font-size-medium;
          color: $color-text-l;
        }
        .clear {
          @include extend-click();
        }
      }
    }
    .list-content {
      max-height: 240px;
      overflow: hidden;
      .item {
        display: flex;
        align-items: center;
        height: 40px;
        padding: 0 30px 0 20px;
        overflow: hidden;
        .current {
          flex: 0 0 20px;
          width: 20px;
          font-size: $font-size-small;
          color: $color-theme-d;
        }
        .text {
          flex: 1;
          @include no-wrap();
          font-size: $font-size-medium;
          color: $color-text-d;
        }
        .favorite {
          @include extend-click();
          margin-right: 15px;
          font-size: $font-size-small;
          color: $color-theme;
          .icon-favorite {
            color: $color-sub-theme;
          }
        }
        .delete {
          @include extend-click();
          font-size: $font-size-small;
          color: $color-theme;
          &.disable {
            color: $color-theme-d;
          }
        }
      }
    }
    .list-footer {
      line-height: 50px;
      text-align: center;
      background: $color-background;
      font-size: $font-size-medium-x;
      color: $color-text-l;
    }
  }
}
</style>

```

### 5-23 播放器 播放列表组件实现（02）

当每次展开的时候，滚动到当前播放的歌曲

```vue
<template>
  <!-- 该组件渲染到body上 合适于全屏类的 有弹层类的组件 -->
  <teleport to="body">
    <transition name="list-fade">
      <div class="playlist" v-show="visible && playlist.length" @click="hide">
        <div class="list-wrapper">
          <div class="list-header">
            <h1 class="title">
              <i class="icon" :class="modeIcon" @click.stop="changeMode"> </i>
              <span class="text">{{ modeText }}</span>
              <span class="clear">
                <i class="icon-clear"></i>
              </span>
            </h1>
          </div>
          <scroll ref="scrollRef" class="list-content" @click.stop>
            <ul ref="listRef">
              <li
                class="item"
                v-for="song in sequenceList"
                :key="song.id"
                @click="selectItem(song)"
              >
                <i class="current" :class="getCurrentIcon(song)"></i>
                <span class="text">{{ song.name }}</span>
                <span class="favorite" @click="toggleFavorite(song)">
                  <i :class="getFavoriteIcon(song)"></i>
                </span>
              </li>
            </ul>
          </scroll>
          <div class="list-footer" @click="hide">
            <span>关闭</span>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script>
import Scroll from '@/components/base/scroll/scroll'
import { ref } from '@vue/reactivity'
import { useStore } from 'vuex'
import { computed, nextTick, watch } from '@vue/runtime-core'
import useMode from './use-mode'
import useFavorite from './use-favorite'
export default {
  components: {
    Scroll
  },
  setup() {
    // data
    const visible = ref(false)
    const scrollRef = ref(null)
    const listRef = ref(null)
    const store = useStore()
    // computed
    const currentSong = computed(() => store.getters.currentSong)
    const playlist = computed(() => store.state.playlist)
    const sequenceList = computed(() => store.state.sequenceList)
    // watch
    watch(currentSong, async (newSong) => {
      /** currentSong 变化有可能 playlist 是没有显示的 */
      if (!visible.value) {
        return
      }
      // currentSong 发生变化时候，为了保证 scroll 没有问题
      await nextTick()
      scrollToCurrent()
    })
    // hoots
    const { modeIcon, changeMode, modeText } = useMode()
    const { getFavoriteIcon, toggleFavorite } = useFavorite()
    // methods
    async function show() {
      visible.value = true

      await nextTick()
      /**
       * 这里要深度记住，vue的数据驱动，但是DOM的变化有个nextTick,
       * 这个时候才能拿到渲染好的DOM
       */
      refreshScroll() // 这里依赖DOM 所以要等待 DOM 渲染完毕 才能计算
      scrollToCurrent()
    }

    function hide() {
      visible.value = false
    }

    function scrollToCurrent() {
      const index = sequenceList.value.findIndex(song => {
        return currentSong.value.id === song.id
      })
      const target = listRef.value.children[index]
      scrollRef.value.scroll.scrollToElement(target, 300)
    }
    function getCurrentIcon(song) {
      if (song.id === currentSong.value.id) {
        return 'icon-play'
      }
    }

    function refreshScroll() {
      // 重新计算
      scrollRef.value.scroll.refresh()
    }

    function selectItem(song) {
      const index = playlist.value.findIndex(item => {
        return song.id === item.id
      })
      store.commit('setCurrentIndex', index)
      store.commit('setPlayingState', true)
    }
    return {
      // data
      visible,
      scrollRef,
      listRef,
      // computed
      playlist,
      sequenceList,
      currentSong,
      // methods
      show,
      hide,
      refreshScroll,
      getCurrentIcon,
      selectItem,
      // useMode
      modeIcon,
      changeMode,
      modeText,
      // useFavorite
      getFavoriteIcon,
      toggleFavorite
    }
  }
}
</script>

<style lang="scss" scoped>
.playlist {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  z-index: 200;
  background-color: $color-background-d;
  &.list-fade-enter-active,
  &.list-fade-leave-active {
    transition: opacity 0.3s;
    .list-wrapper {
      transition: all 0.3s;
    }
  }
  &.list-fade-enter-from,
  &.list-fade-leave-to {
    opacity: 0;
    .list-wrapper {
      transform: translate3d(0, 100%, 0);
    }
  }
  .list-wrapper {
    position: fixed;
    left: 0;
    bottom: 0;
    z-index: 210;
    width: 100%;
    background-color: $color-highlight-background;
    .list-header {
      position: relative;
      padding: 20px 30px 10px 20px;
      .title {
        display: flex;
        align-items: center;
        .icon {
          margin-right: 10px;
          font-size: 24px;
          color: $color-theme-d;
        }
        .text {
          flex: 1;
          font-size: $font-size-medium;
          color: $color-text-l;
        }
        .clear {
          @include extend-click();
        }
      }
    }
    .list-content {
      max-height: 240px;
      overflow: hidden;
      .item {
        display: flex;
        align-items: center;
        height: 40px;
        padding: 0 30px 0 20px;
        overflow: hidden;
        .current {
          flex: 0 0 20px;
          width: 20px;
          font-size: $font-size-small;
          color: $color-theme-d;
        }
        .text {
          flex: 1;
          @include no-wrap();
          font-size: $font-size-medium;
          color: $color-text-d;
        }
        .favorite {
          @include extend-click();
          margin-right: 15px;
          font-size: $font-size-small;
          color: $color-theme;
          .icon-favorite {
            color: $color-sub-theme;
          }
        }
        .delete {
          @include extend-click();
          font-size: $font-size-small;
          color: $color-theme;
          &.disable {
            color: $color-theme-d;
          }
        }
      }
    }
    .list-footer {
      line-height: 50px;
      text-align: center;
      background: $color-background;
      font-size: $font-size-medium-x;
      color: $color-text-l;
    }
  }
}
</style>

```

### 5-24 播放器 播放列表组件实现（03）

删除功能

playlist.vue

```js
  function removeSong(song) {
      store.dispatch('removeSong', song)
    }
```

actions.js

```js
export function removeSong({ commit, state }, song) {
    // 加上 slice 没有副作用
    const sequenceList = state.sequenceList.slice()
    const playlist = state.playlist.slice()

    // 找出 index 删除歌曲
    const sequenceIndex = findIndex(sequenceList, song)
    const playIndex = findIndex(playlist, song)

    sequenceList.splice(sequenceIndex, 1)
    playlist.splice(playIndex, 1)

    commit('setSequenceList', sequenceList)
    commit('setPlaylist', playlist)
}

function findIndex(list, song) {
    return list.findIndex(item => {
        return item.id === song.id
    })
}
```

以上是完成了删除的功能。但是我们希望不是删除当前的歌曲，是不会影响当前的播放的，但是当删除当前播放歌曲的前面一首歌的时候会影响播放，歌曲变化了

原因：虽然删除了歌曲，当是 vuex 中的 currentIndex 还是原来的数据，所以就播放了下一首歌，也就是说，假如当前的歌曲是第二首歌，我删除了第三首歌，currendIndex 还是1，歌曲没有变化，当我删除第一首歌，那么第二首歌的下标就改为第一首歌的了，所以歌曲播放内容也变化了

此时还有一个问题：如果删除最后一首歌的，会报错，因为，假如只有10首歌，下标对应 0 - 9，删除最后一首歌，它的下标还是9，会报错



```js
export function removeSong({ commit, state }, song) {
    // 加上 slice 没有副作用
    const sequenceList = state.sequenceList.slice()
    const playlist = state.playlist.slice()

    // 找出 index 删除歌曲
    const sequenceIndex = findIndex(sequenceList, song)
    const playIndex = findIndex(playlist, song)

    sequenceList.splice(sequenceIndex, 1)
    playlist.splice(playIndex, 1)
    let currentIndex = state.currentIndex
    if (playIndex < currentIndex || currentIndex === playlist.length) {
        currentIndex--
    }
    commit('setCurrentIndex', currentIndex)
    commit('setSequenceList', sequenceList)
    commit('setPlaylist', playlist)
}

```

### 5-25 播放器 播放列表组件实现（04）

这时会发现, 当删除歌曲是当前播放歌曲的前面的时候，会将播放状态做修改。

分析：这个时候会去触发 slidePageChang 事件

```js
sliderVal.on('slidePageChanged', ({ pageX }) => {
                        store.commit('setCurrentIndex', pageX)
                        store.commit('setPlayingState', true)
                    })
```

这样就修改的播放状态为 true，所以就造成bug, 那么这里为什么要这样写？ 是当在min播放器里面左右切换时去触发播放，当在playlist在做删除操作时会触发这个事件



解决

将 store.commit('setPlayingState', true) 部分删除

```js
                    sliderVal.on('slidePageChanged', ({ pageX }) => {
                        console.log('slidePageChanged')
                        store.commit('setCurrentIndex', pageX)
                        // store.commit('setPlayingState', true)
                    })
```

player.vue

prev(), next() 里面的 store.commit('setPlayingState', true) 删除

在 监听 currentSong 的时候，监听  store.commit('setPlayingState', true)，因为当 currentIndex 变化的时候会去触发 currentSong， 这时去改变 playingState 的值

```js
    watch(currentSong, (newSong) => {
      if (!newSong.id || !newSong.url) {
        return
      }
      /**
       * 当切换歌曲的时候将 songReady 置为 false
       * 然后再去执行 audioEl.play()，然后歌曲去进行缓存，触发canplay事件，然后执行ready函数 将songReady 置为 true
       */
      currentTime.value = 0 // 当歌曲变化时 置为0
      songReady.value = false
      const audioEl = audioRef.value
      audioEl.src = newSong.url
      audioEl.play()
      store.commit('setPlayingState', true)
    })
```

这时又发现切换的时候，图片不能显示除了，因为歌曲已经删除了，但是DOM还没有更新， 之前的 sliderVal.refresh() 是解决 fullScreen 来回切换时去 refresh()，

解决：在playlist 展开或者隐藏的时候呢，那个 refresh() 是没有发生变化的，所以这里要多加一个逻辑去watch playlist 的变化， 因为歌曲发生变化了本质上是playlist的变化

```js
        watch(playlist, async () => {
            // 当 playlist 发生变化的时候，可能 sliderVal 不存在
            if (sliderVal && sliderShow.value) {
                await nextTick()
                sliderVal.refresh()
            }
        })
```

这时还是存在问题，当去快速删除的时候，会报错 offsetWidth of undefined，这是因为DOM没有找到 为 -1, 那为什么为 - 1 ? 当点击按钮的时候，是有过渡动画的，当动画没有结束时也就是按钮还是存在的，疯狂点击之后可能触发了好几次，所以对同一首歌执行了好几次，第一次已经将歌曲删除掉了，但是又去触发一次所以就得到 - 1, currentSong 也就是空对象

```js
    function scrollToCurrent() {
      const index = sequenceList.value.findIndex((song) => {
        return currentSong.value.id === song.id
      })
      
      // const target = listRef.value.children[index]
      const target = listRef.value.$el.children[index]
      scrollRef.value.scroll.scrollToElement(target, 300)
    }
```

解决

```js
   watch(currentSong, async (newSong) => {
      /** currentSong 变化有可能 playlist 是没有显示的 */
      if (!visible.value || !newSong.id) {
        return
      }
      // currentSong 发生变化时候，为了保证 scroll 没有问题
      await nextTick()
      scrollToCurrent()
    })
```

```js
   function scrollToCurrent() {
      const index = sequenceList.value.findIndex((song) => {
        return currentSong.value.id === song.id
      })
      if (index === -1) {
        return
      }
      // const target = listRef.value.children[index]
      const target = listRef.value.$el.children[index]
      scrollRef.value.scroll.scrollToElement(target, 300)
    }
```

这里我们还是不希望能够快速去点击删除歌曲，可能上一首歌没有ready时又去切换下一首歌可能会触发DOM报错，所以要做一些限制

解决：当去删除过程中，也就是动画过程中不希望再去删除歌曲了，包括当前的歌曲

```
    const removing = ref(false)
```

```js
    function removeSong(song) {
      if (removing.value) {
        return
      }
      removing.value = true
      store.dispatch('removeSong', song)
      setTimeout(() => {
        removing.value = false
      }, 300)
    }
```

```HTML
                <span
                  class="delete"
                  @click.stop="removeSong(song)"
                  :class="{ disable: removing }"
                >
                  <i class="icon-delete"></i>
                </span>

```

要考虑多维度保护

```js
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
    let currentIndex = state.currentIndex
    if (playIndex < currentIndex || currentIndex === playlist.length) {
        currentIndex--
    }
    commit('setCurrentIndex', currentIndex)
    commit('setSequenceList', sequenceList)
    commit('setPlaylist', playlist)
}
```

### 5-26 播放器 播放列表组件实现（05）

当点击垃圾桶图标会弹出对话框，点击清空，和取消执行对应的逻辑

confirm.vue

```vue
<template>
  <teleport to="body">
    <transition name="confirm-fade">
      <div class="confirm" v-show="visible">
        <div class="confirm-wrapper">
          <div class="confirm-content">
            <p class="text">{{text}}</p>
            <div class="operate">
              <div
                class="operate-btn left"
                @click="confirm"
              >{{confirmBtnText}}
              </div>
              <div
                class="operate-btn"
                @click="cancel"
              >{{cancelBtnText}}
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script>
  export default {
    name: 'confirm',
    props: {
      text: {
        type: String,
        default: ''
      },
      confirmBtnText: {
        type: String,
        default: '确定'
      },
      cancelBtnText: {
        type: String,
        default: '取消'
      }
    },
    data() {
      return {
        visible: false
      }
    },
    emits: ['confirm', 'cancel'],
    methods: {
      confirm() {
        this.hide()
        this.$emit('confirm')
      },
      cancel() {
        this.hide()
        this.$emit('cancel')
      },
      hide() {
        this.visible = false
      },
      show() {
        this.visible = true
      }
    }
  }
</script>

<style scoped lang="scss">
  .confirm {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 998;
    background-color: $color-background-d;
    &.confirm-fade-enter-active {
      animation: confirm-fadein .3s;
      .confirm-content {
        animation: confirm-zoom-in .3s;
      }
    }
    &.confirm-fade-leave-active {
      animation: confirm-fadeout .3s;
      .confirm-content {
        animation: confirm-zoom-out .3s;
      }
    }
    .confirm-wrapper {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 999;
      .confirm-content {
        width: 270px;
        border-radius: 13px;
        background: $color-highlight-background;
        .text {
          padding: 19px 15px;
          line-height: 22px;
          text-align: center;
          font-size: $font-size-large;
          color: $color-text-l;
        }
        .operate {
          display: flex;
          align-items: center;
          text-align: center;
          font-size: $font-size-large;
          .operate-btn {
            flex: 1;
            line-height: 22px;
            padding: 10px 0;
            border-top: 1px solid $color-background-d;
            color: $color-text-l;
            &.left {
              border-right: 1px solid $color-background-d;
              color: $color-text;
            }
          }
        }
      }
    }
  }

  @keyframes confirm-fadein {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes confirm-fadeout {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  @keyframes confirm-zoom-in {
    0% {
      transform: scale(0);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes confirm-zoom-out {
    0% {
      transform: scale(1);
    }
    100% {
      transform: scale(0);
    }
  }
</style>

```

playlist.vue

```js
 function confirmClear() {
      store.dispatch('clearSongList')
      hide()
    }
```

actions.js

```js
export function clearSongList({ commit }) {
    commit('setSequenceList', [])
    commit('setPlaylist', [])
    commit('setCurrentIndex', 0)
    commit('setPlayingState', false)
}
```

### 5-27 播放器 滚动列表高度自适应_

当min播放器存在的时候，会遮挡scroll 列表，所以动态添加 bottom 高度，

但是在推荐列表，歌手列表等地方都需要动态添加，所以在 router-view 添加

```vue
<template>
  <m-header />
  <tab />
  <router-view :style="viewStyle" />
  <player></player>
</template>
<script>
import Header from '@/components/header/header'
import Tab from '@/components/tab/tab'
import Player from '@/components/player/player'
import { mapState } from 'vuex'

export default {
  components: {
    MHeader: Header,
    Tab,
    Player
  },
  computed: {
    ...mapState([
      'playlist'
    ]),
    viewStyle() {
      const bottom = this.playlist.length ? '60px' : '0'
      return {
        bottom
      }
    }
  }
}
</script>
<style lang="scss">
</style>

```

此时还会有问题，scroll高度变化了，但是没有去 refresh 重新计算，但是滚动之后到底部又拉一下又行了，其实内部会执行一次 refresh 计算，所以计算又正确了

### 5-28 播放器 高阶 Scroll 组件的实现

解决前面提到的问题

解决： 监测playlist 的变化然后重新计算 refresh

那么可以将解决逻辑放在 scroll 里面？ 这样是不行的

* 因为 scroll 是基础组件，playlist 是个业务数据，整个逻辑都是偏业务的逻辑，如果放在基础组件里面显然是不合理的
* 并不是所有scroll 组件都需要整个逻辑，比如说歌词也是用了scroll组件但是不需要这些逻辑

可以封装业务组件，封装高阶scroll组件

```js
import { h, mergeProps, withCtx, renderSlot, ref, computed, watch, nextTick } from 'vue'
import Scroll from '@/components/base/scroll/scroll'
import { useStore } from 'vuex'

export default {
    name: 'wrap-scroll',
    props: Scroll.props,
    emits: Scroll.emits,
    render(ctx) {
        return h(Scroll, mergeProps({
            ref: 'scrollRef'
        }, ctx.$props, {
            onScroll: (e) => {
                ctx.$emit('scroll', e)
            }
        }), {
            default: withCtx(() => {
                return [renderSlot(ctx.$slots, 'default')]
            })
        })
    },
    setup() {
        const scrollRef = ref(null)
        const scroll = computed(() => {
            return scrollRef.value.scroll
        })

        const store = useStore()
        const playlist = computed(() => store.state.playlist)

        watch(playlist, async () => {
            await nextTick()
            scroll.value.refresh()
        })

        return {
            scrollRef,
            scroll
        }
    }
}

```

### 6-1 歌单详情页开发（上）

歌单详情页面有很多代码是可以复用之前的逻辑的，所以当有重复的逻辑代码的时候，尽量不要去复制粘贴然后去修改代码，这是非常low的操作，我们要将其封装到一个文件里面，方便后续功能的复用

新建 created-detail-components.js

封装可以复用代码

```js
import MusicList from '@/components/music-list/music-list'
import storage from 'good-storage'
import { processSongs } from '@/service/song'
export default function createDetailComponent(name, key, fetch) {
    return {
        name,
        components: { MusicList },
        props: {
            data: Object
        },
        data() {
            return {
                songs: [],
                loading: true
            }
        },
        computed: {
            computedData() {
                let ret = null
                const data = this.data
                if (data) {
                    ret = data
                } else {
                    const cacheSinger = storage.session.get(key)
                    if (cacheSinger && cacheSinger.mid === this.$route.params.id) {
                        ret = cacheSinger
                    }
                }
                return ret
            },
            pic() {
                const data = this.computedData
                return data && data.pic
            },
            title() {
                const data = this.computedData
                return data && (data.name || data.title)
            }
        },
        async created() {
            const data = this.computedData
            if (!data) {
                const path = this.$route.matched[0].path
                this.$router.push({
                    path
                })
                return
            }
            const result = await fetch(data)
            this.songs = await processSongs(result.songs)
            this.loading = false
        }
    }
}

```

singer-detail 使用

```vue
<template>
  <div class="singer-detail">
    <music-list
      :songs="songs"
      :title="title"
      :pic="pic"
      :loading="loading"
    ></music-list>
  </div>
</template>

<script>
  import createDetailComponent from '@/assets/js/create-detail-component'
  import { getSingerDetail } from '@/service/singer'
  import { SINGER_KEY } from '@/assets/js/constant'

  export default createDetailComponent('singer-detail', SINGER_KEY, getSingerDetail)
</script>

<style lang="scss" scoped>
  .singer-detail {
    position: fixed;
    z-index: 10;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: $color-background;
  }
</style>

```

recommed.vue

```vue
<template>
  <div class="recommend" v-loading="loading">
    <scroll class="recommend-content">
      <div>
        <!-- scroll 只针对第一个元素生效 所以嵌套多个DIV -->
        <div class="slider-wrapper">
          <div class="slider-content">
            <slider v-if="sliders.length" :sliders="sliders"></slider>
          </div>
        </div>
        <div class="recommend-list">
          <h1 class="list-title" v-show="!loading">热门歌单推荐</h1>
          <ul>
            <li
              class="item"
              v-for="item in albums"
              :key="item.id"
              @click="selectItem(item)"
            >
              <div class="icon">
                <img width="60" height="60" v-lazy="item.pic" />
              </div>
              <div class="text">
                <h2 class="name">
                  {{ item.username }}
                </h2>
                <p class="title">
                  {{ item.title }}
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </scroll>
    <router-view v-slot="{ Component }">
      <transition appear name="slide">
        <component :is="Component" :data="selectedAlbum" />
      </transition>
    </router-view>
  </div>
</template>

<script>
import Scroll from '@/components/wrap-scroll'
import { getRecommend } from '@/service/recommend'
import Slider from '@/components/base/slider/slider.vue'
import storage from 'good-storage'
import { ALBUM_KEY } from '@/assets/js/constant'
export default {
  data() {
    return {
      sliders: [],
      albums: [],
      Text: '测试测试...',
      selectedAlbum: null
    }
  },
  components: {
    Slider,
    Scroll
  },
  computed: {
    loading() {
      return !this.sliders.length && !this.albums.length
    }
  },
  async created() {
    const result = await getRecommend()
    this.sliders = result.sliders
    this.albums = result.albums
  },
  methods: {
    selectItem(album) {
      this.selectedAlbum = album
      this.cacheAlbum(album)
      this.$router.push({
        path: `/recommend/${album.id}`
      })
    },
    cacheAlbum(album) {
      storage.session.set(ALBUM_KEY, album)
    }
  }
}
</script>

<style lang="scss" scoped>
.recommend {
  position: fixed;
  width: 100%;
  top: 88px;
  bottom: 0;
  overflow: scroll;
  .recommend-content {
    height: 100%;
    overflow: hidden;
    .slider-wrapper {
      position: relative;
      width: 100%;
      height: 0;
      padding-top: 40%;
      overflow: hidden;
      .slider-content {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
      }
    }
    .recommend-list {
      .list-title {
        height: 65px;
        line-height: 65px;
        text-align: center;
        font-size: $font-size-medium;
        color: $color-theme;
      }
      .item {
        display: flex;
        box-sizing: border-box;
        align-items: center;
        padding: 0 20px 20px 20px;

        .icon {
          flex: 0 0 60px;
          width: 60px;
          padding-right: 20px;
        }
        .text {
          display: flex;
          flex-direction: column;
          justify-content: center;
          flex: 1;
          line-height: 20px;
          overflow: hidden;
          font-size: $font-size-medium;
        }
        .name {
          margin-bottom: 10px;
          color: $color-text;
        }
        .title {
          color: $color-text-d;
        }
      }
    }
  }
}
</style>

```

album.vue

```vue
<template>
  <div class="album">
    <music-list
      :songs="songs"
      :title="title"
      :pic="pic"
      :loading="loading"
    ></music-list>
  </div>
</template>

<script>
import createDetailComponent from '@/assets/js/create-detail-component'
import { getAlbum } from '@/service/recommend'
import { ALBUM_KEY } from '@/assets/js/constant'

export default createDetailComponent('album', ALBUM_KEY, getAlbum)
</script>

<style lang="scss" scoped>
.album {
  position: fixed;
  z-index: 10;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: $color-background;
}
</style>

```

### 6-2 歌单详情页开发（下）

### 6-3 排行榜页面开发_

```vue
<template>
  <div class="top-list" v-loading="loading">
    <scroll class="top-list-content">
      <ul>
        <li class="item" v-for="item in topList" :key="item.id">
          <div class="icon">
            <img width="100" height="100" v-lazy="item.pic" />
          </div>
          <ul class="song-list">
            <li
              class="song"
              v-for="(song, index) in item.songList"
              :key="song.id"
            >
              <span>{{ index + 1 }}</span>
              <span>{{ song.songName }}-{{ song.singerName }}</span>
            </li>
          </ul>
        </li>
      </ul>
    </scroll>
  </div>
</template>

<script>
import Scroll from '@/components/wrap-scroll'
import { getTopList } from '@/service/top-list'
export default {
  name: 'top-list',
  components: {
    Scroll
  },
  data() {
    return {
      topList: [],
      loading: true
    }
  },
  async created() {
    const result = await getTopList()
    this.topList = result.topList
    this.loading = false
  }
}
</script>

<style lang="scss" scoped>
.top-list {
  position: fixed;
  width: 100%;
  top: 88px;
  bottom: 0;
  .top-list-content {
    height: 100%;
    overflow: hidden;
    .item {
      display: flex;
      margin: 0 20px;
      padding-top: 20px;
      height: 100px;
      &:last-child {
        padding-bottom: 20px;
      }
      .icon {
        flex: 0 0 100px;
        width: 100px;
        height: 100px;
      }
      .song-list {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 0 20px;
        height: 100px;
        overflow: hidden;
        background: $color-highlight-background;
        color: $color-text-d;
        font-size: $font-size-small;
        .song {
          @include no-wrap();
          line-height: 26px;
        }
      }
    }
  }
}
</style>

```

### 6-4 排行榜详情页开发（上）

点击排行榜进入榜单详情页，发现它和歌手详情页和歌单详情页都是差不多的，还是用 create-detail-components 去开发

top-detail.vue

```vue
<template>
  <div class="top-detail">
    <music-list
      :songs="songs"
      :title="title"
      :pic="pic"
      :loading="loading"
    ></music-list>
  </div>
</template>

<script>
import createDetailComponent from '@/assets/js/create-detail-component'
import { getTopDetail } from '@/service/top-list'
import { TOP_KEY } from '@/assets/js/constant'

export default createDetailComponent('top-detail', TOP_KEY, getTopDetail)
</script>

<style lang="scss" scoped>
.top-detail {
  position: fixed;
  z-index: 10;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: $color-background;
}
</style>

```

### 6-5 排行榜详情页开发（下）

### 7-1 搜索页面搜索框开发_

当输入搜索key时，会生成一个搜索列表，这个列表是可以上来加载的等



默认情况下，组件上的 `v-model` 使用 `modelValue` 作为 prop 和 `update:modelValue` 作为事件。我们可以通过向 `v-model` 传递参数来修改这些名称：

search.vue

```vue
<template>
  <div class="search">
    <search-input v-model="query" />
  </div>
</template>

<script>
import SearchInput from '@/components/search/search-input'
import { ref } from '@vue/reactivity'
export default {
  components: {
    SearchInput
  },
  setup() {
    // data
    const query = ref('')
    return {
      query
    }
  }
}
</script>

<style>
</style>

```

search-input.vue

```vue
<template>
  <div class="search-input">
    <i class="icon-search"></i>
    <input class="input-inner" v-model="query" :placeholder="placeholder" />
    <i class="icon-dismiss" v-show="query" @click="clear"></i>
  </div>
</template>

<script>
import { debounce } from 'throttle-debounce'
export default {
  name: 'search-input',
  props: {
    modelValue: String,
    placeholder: {
      type: String,
      default: '搜索歌曲、歌手'
    }
  },
  data() {
    return {
      query: this.modelValue
    }
  },
  created() {
    this.$watch('query', debounce(300, (newQuery) => {
      this.$emit('update:modelValue', newQuery.trim())
    }))
    this.$watch('modelValue', (newVal) => {
      this.query = newVal
    })
  },
  methods: {
    clear() {
      this.query = ''
    }
  }
}
</script>

<style lang="scss" scoped>
.search-input {
  width: 100%;
  display: flex;
  align-items: center;
  height: 33px;
  padding: 0 6px;
  background: $color-highlight-background;
  border-radius: 6px;
  box-sizing: border-box;
  .icon-search {
    font-size: 24px;
    color: $color-text-d;
  }
  .input-inner {
    flex: 1;
    margin: 0 5px;
    line-height: 18px;
    background: $color-highlight-background;
    color: $color-text;
    font-size: $font-size-medium;
    outline: none;
  }
  .icon-dismiss {
    font-size: 16px;
    color: $color-text-d;
  }
}
</style>

```

### 7-2 搜索页面热门搜索开发_

```vue
<template>
  <div class="search">
    <div class="search-input-wrapper">
      <search-input v-model="query" />
    </div>
    <div class="search-content">
      <div class="hot-keys">
        <h1 class="title">热门搜索</h1>
        <ul>
          <li
            class="item"
            v-for="item in hotKeys"
            :key="item.id"
            @click="addQuery(item.key)"
          >
            <span>{{ item.key }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import SearchInput from '@/components/search/search-input'
import { ref } from '@vue/reactivity'
import { getHotKeys } from '@/service/search'
export default {
  components: {
    SearchInput
  },
  setup() {
    // data
    const query = ref('')
    const hotKeys = ref([])

    // http
    getHotKeys().then(result => {
      hotKeys.value = result.hotKeys
    })

    // methods
    function addQuery(s) {
      query.value = s
    }
    return {
      query,
      hotKeys,
      addQuery
    }
  }
}
</script>

<style lang="scss" scoped>
.search {
  .search-input-wrapper {
    margin: 20px;
  }
  .hot-keys {
    margin: 0 20px 20px 20px;
    .title {
      margin-bottom: 20px;
      font-size: $font-size-medium;
      color: $color-text-l;
    }
    .item {
      display: inline-block;
      padding: 5px 10px;
      margin: 0 20px 10px 0;
      border-radius: 6px;
      background: $color-highlight-background;
      font-size: $font-size-medium;
      color: $color-text-d;
    }
  }
}
</style>

```

### 7-3 搜索页面 Suggest 组件开发（01）

```vue
<template>
  <div ref="rootRef" class="suggest" v-loading:[loadingText]="!songs.length">
    <ul class="suggest-list">
      <li class="suggest-item" v-if="singer">
        <div class="icon">
          <i class="icon-mine"></i>
        </div>
        <div class="name">
          <p class="text">{{ singer.name }}</p>
        </div>
      </li>

      <li class="suggest-item" v-for="song in songs" :key="song.id">
        <div class="icon">
          <i class="icon-music"></i>
        </div>
        <div class="name">
          <p class="text">{{ song.singer }}-{{ song.name }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { ref, watch } from '@vue/runtime-core'
import { search } from '@/service/search'
import { processSongs } from '@/service/song'
import usePullUpLoad from './use-pull-up-load.js'
export default {
  props: {
    query: {
      type: String
    },
    showSinger: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    //   data
    const singer = ref(null)
    const page = ref(1)
    const songs = ref([])
    const hasMore = ref(true)
    const loadingText = ref('')

    // hooks
    const { rootRef } = usePullUpLoad()
    // computed
    //   watch
    watch(() => props.query, async (newQuery) => {
      await searchFirst()
    })

    // method
    async function searchFirst() {
      if (!props.query) {
        return
      }
      page.value = 1
      songs.value = []
      singer.value = null
      hasMore.value = true
      const result = await search(props.query, page.value, props.showSinger)
      songs.value = await processSongs(result.songs)
      singer.value = result.singer
      hasMore.value = result.hasMore
    }

    return {
      // data
      songs,
      loadingText,
      singer,
      // computed
      // usePullUpLoad
      rootRef
    }
  }
}
</script>

<style lang="scss" scoped>
.suggest {
  height: 100%;
  overflow: hidden;
  .suggest-list {
    padding: 0 30px;
    .suggest-item {
      display: flex;
      align-items: center;
      padding-bottom: 20px;
      .icon {
        flex: 0 0 30px;
        width: 30px;
        color: $color-text-d;
        font-size: 14px;
      }
      .name {
        flex: 1;
        font-size: $font-size-medium;
        color: $color-text-d;
        overflow: hidden;
        .text {
          @include no-wrap();
        }
      }
    }
  }
}
</style>

```

### 7-4 搜索页面 Suggest 组件开发（02）

解决边界情况，当没有搜索到内容时，提示没有搜索到内容

```vue
<template>
  <div
    ref="rootRef"
    class="suggest"
    v-loading:[loadingText]="loading"
    v-no-result:[noResultText]="noResult"
  >
    <ul class="suggest-list">
      <li class="suggest-item" v-if="singer">
        <div class="icon">
          <i class="icon-mine"></i>
        </div>
        <div class="name">
          <p class="text">{{ singer.name }}</p>
        </div>
      </li>

      <li class="suggest-item" v-for="song in songs" :key="song.id">
        <div class="icon">
          <i class="icon-music"></i>
        </div>
        <div class="name">
          <p class="text">{{ song.singer }}-{{ song.name }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { computed, ref, watch } from '@vue/runtime-core'
import { search } from '@/service/search'
import { processSongs } from '@/service/song'
import usePullUpLoad from './use-pull-up-load.js'
export default {
  props: {
    query: {
      type: String
    },
    showSinger: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    //   data
    const singer = ref(null)
    const page = ref(1)
    const songs = ref([])
    const hasMore = ref(true)
    const loadingText = ref('')
    const noResultText = ref('抱歉，暂无搜索结果')

    // hooks
    const { rootRef } = usePullUpLoad()
    // computed
    const loading = computed(() => {
      return !singer.value && !songs.value.length
    })
    const noResult = computed(() => {
      return !singer.value && !songs.value.length && !hasMore.value
    })

    //   watch
    watch(() => props.query, async (newQuery) => {
      await searchFirst()
    })

    // method
    async function searchFirst() {
      if (!props.query) {
        return
      }
      page.value = 1
      songs.value = []
      singer.value = null
      hasMore.value = true

      const result = await search(props.query, page.value, props.showSinger)
      songs.value = await processSongs(result.songs)
      singer.value = result.singer
      hasMore.value = result.hasMore
    }

    return {
      // data
      songs,
      loadingText,
      singer,
      noResultText,
      // computed
      noResult,
      loading,
      // usePullUpLoad
      rootRef
    }
  }
}
</script>

<style lang="scss" scoped>
.suggest {
  height: 100%;
  overflow: hidden;
  .suggest-list {
    padding: 0 30px;
    .suggest-item {
      display: flex;
      align-items: center;
      padding-bottom: 20px;
      .icon {
        flex: 0 0 30px;
        width: 30px;
        color: $color-text-d;
        font-size: 14px;
      }
      .name {
        flex: 1;
        font-size: $font-size-medium;
        color: $color-text-d;
        overflow: hidden;
        .text {
          @include no-wrap();
        }
      }
    }
  }
}
</style>

```

### 7-5 搜索页面 Suggest 组件开发（03）

上拉加载，具体功能看better-scroll 文档

当下拉结束时要告诉better-scoll  `scrollVal.finishPullUp()`

suggest.vue

```vue
<template>
  <div
    ref="rootRef"
    class="suggest"
    v-loading:[loadingText]="loading"
    v-no-result:[noResultText]="noResult"
  >
    <ul class="suggest-list">
      <li class="suggest-item" v-if="singer">
        <div class="icon">
          <i class="icon-mine"></i>
        </div>
        <div class="name">
          <p class="text">{{ singer.name }}</p>
        </div>
      </li>
      <li class="suggest-item" v-for="song in songs" :key="song.id">
        <div class="icon">
          <i class="icon-music"></i>
        </div>
        <div class="name">
          <p class="text">{{ song.singer }}-{{ song.name }}</p>
        </div>
      </li>
      <div class="suggest-item" v-loading:[loadingText]="pullUpLoading"></div>
    </ul>
  </div>
</template>

<script>
import { computed, ref, watch } from '@vue/runtime-core'
import { search } from '@/service/search'
import { processSongs } from '@/service/song'
import usePullUpLoad from './use-pull-up-load.js'
export default {
  props: {
    query: {
      type: String
    },
    showSinger: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    //   data
    const singer = ref(null)
    const page = ref(1)
    const songs = ref([])
    const hasMore = ref(true)
    const loadingText = ref('')
    const noResultText = ref('抱歉，暂无搜索结果')

    // hooks
    const { rootRef, isPullUpLoad } = usePullUpLoad(searchMore)
    // computed
    const loading = computed(() => {
      return !singer.value && !songs.value.length
    })
    const noResult = computed(() => {
      return !singer.value && !songs.value.length && !hasMore.value
    })

    const pullUpLoading = computed(() => {
      return isPullUpLoad.value && hasMore.value
    })
    //   watch
    watch(() => props.query, async (newQuery) => {
      await searchFirst()
    })

    // method
    async function searchFirst() {
      if (!props.query) {
        return
      }
      page.value = 1
      songs.value = []
      singer.value = null
      hasMore.value = true

      const result = await search(props.query, page.value, props.showSinger)
      songs.value = await processSongs(result.songs)
      singer.value = result.singer
      hasMore.value = result.hasMore
    }

    async function searchMore() {
      if (!hasMore.value && !props.query) {
        return
      }
      page.value++
      const result = await search(props.query, page.value, props.showSinger)
      songs.value = songs.value.concat(await processSongs(result.songs))
      hasMore.value = result.hasMore
      console.log(hasMore.value)
    }

    return {
      // data
      songs,
      loadingText,
      singer,
      noResultText,
      // computed
      noResult,
      loading,
      pullUpLoading,
      // usePullUpLoad
      rootRef,
      isPullUpLoad
    }
  }
}
</script>

<style lang="scss" scoped>
.suggest {
  height: 100%;
  overflow: hidden;
  .suggest-list {
    padding: 0 30px;
    .suggest-item {
      display: flex;
      align-items: center;
      padding-bottom: 20px;
      .icon {
        flex: 0 0 30px;
        width: 30px;
        color: $color-text-d;
        font-size: 14px;
      }
      .name {
        flex: 1;
        font-size: $font-size-medium;
        color: $color-text-d;
        overflow: hidden;
        .text {
          @include no-wrap();
        }
      }
    }
  }
}
</style>

```

use-pull-up-load.js

```js
import BScroll from '@better-scroll/core'
import PullUp from '@better-scroll/pull-up'
import { onMounted, onUnmounted, ref } from 'vue'
import ObserveDOM from '@better-scroll/slide'
BScroll.use(PullUp)
BScroll.use(ObserveDOM)

export default function usePullUpLoad(requestData, preventPullUpLoad) {
    const rootRef = ref(null)
    const scroll = ref(null)
    const isPullUpLoad = ref(false) // 判断拉去是否结束

    onMounted(() => {
        const scrollVal = scroll.value = new BScroll(rootRef.value, {
            pullUpLoad: true,
            click: true,
            ObserveDOM: true
        })
        scrollVal.on('pullingUp', pullingUpHandler)

        async function pullingUpHandler() {
            isPullUpLoad.value = true
            await requestData()
            scrollVal.finishPullUp() // 告诉better-scroll 上拉结束
            scrollVal.refresh() // 更新DOM
            isPullUpLoad.value = false
        }
    })

    onUnmounted(() => {
        scroll.value.destroy()
    })
    return {
        scroll,
        rootRef,
        isPullUpLoad
    }
}

```

### 7-6 搜索页面 Suggest 组件开发（04）

有一些数据返回不足一屏，是因为后端数据处理过程中过来掉了部分付费歌曲等，所以首次请求的数据比较少，不足铺满一屏幕，在老版本的better-scroll是不能滚动的，因为没有满足滚动条件，新版本的better-scroll是做了些处理的可以滚动

但是在当前的场景下，better-scroll做的处理是不够的，站在用户角度去看这个事情，如果当数据不足一屏幕，就会认为已经加载完了，没有更多的数据，就不会去做上拉加载。有时候加载的数据比较少，得上拉多次才能铺满一屏



```vue
<template>
  <div
    ref="rootRef"
    class="suggest"
    v-loading:[loadingText]="loading"
    v-no-result:[noResultText]="noResult"
  >
    <ul class="suggest-list">
      <li class="suggest-item" v-if="singer">
        <div class="icon">
          <i class="icon-mine"></i>
        </div>
        <div class="name">
          <p class="text">{{ singer.name }}</p>
        </div>
      </li>
      <li class="suggest-item" v-for="song in songs" :key="song.id">
        <div class="icon">
          <i class="icon-music"></i>
        </div>
        <div class="name">
          <p class="text">{{ song.singer }}-{{ song.name }}</p>
        </div>
      </li>
      <div class="suggest-item" v-loading:[loadingText]="pullUpLoading"></div>
    </ul>
  </div>
</template>

<script>
import { computed, nextTick, ref, watch } from '@vue/runtime-core'
import { search } from '@/service/search'
import { processSongs } from '@/service/song'
import usePullUpLoad from './use-pull-up-load.js'
export default {
  props: {
    query: {
      type: String
    },
    showSinger: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    //   data
    const singer = ref(null)
    const page = ref(1)
    const songs = ref([])
    const hasMore = ref(true)
    const loadingText = ref('')
    const noResultText = ref('抱歉，暂无搜索结果')

    // hooks
    const { rootRef, scroll, isPullUpLoad } = usePullUpLoad(searchMore)
    // computed
    const loading = computed(() => {
      return !singer.value && !songs.value.length
    })
    const noResult = computed(() => {
      return !singer.value && !songs.value.length && !hasMore.value
    })

    const pullUpLoading = computed(() => {
      return isPullUpLoad.value && hasMore.value
    })
    //   watch
    watch(() => props.query, async (newQuery) => {
      await searchFirst()
    })

    // method
    async function searchFirst() {
      if (!props.query) {
        return
      }
      page.value = 1
      songs.value = []
      singer.value = null
      hasMore.value = true

      const result = await search(props.query, page.value, props.showSinger)
      songs.value = await processSongs(result.songs)
      singer.value = result.singer
      hasMore.value = result.hasMore
      await nextTick()
      await makeItScrollable()
    }

    async function searchMore() {
      if (!hasMore.value && !props.query) {
        return
      }
      page.value++
      const result = await search(props.query, page.value, props.showSinger)
      songs.value = songs.value.concat(await processSongs(result.songs))
      hasMore.value = result.hasMore
      await nextTick()
      await makeItScrollable()
    }

    async function makeItScrollable() {
      if (scroll.value.maxScrollY >= -1) {
        await searchMore()
      }
    }

    return {

      // data
      songs,
      loadingText,
      singer,
      noResultText,
      // computed
      noResult,
      loading,
      pullUpLoading,
      // usePullUpLoad
      rootRef,
      isPullUpLoad
    }
  }
}
</script>

<style lang="scss" scoped>
.suggest {
  height: 100%;
  overflow: hidden;
  .suggest-list {
    padding: 0 30px;
    .suggest-item {
      display: flex;
      align-items: center;
      padding-bottom: 20px;
      .icon {
        flex: 0 0 30px;
        width: 30px;
        color: $color-text-d;
        font-size: 14px;
      }
      .name {
        flex: 1;
        font-size: $font-size-medium;
        color: $color-text-d;
        overflow: hidden;
        .text {
          @include no-wrap();
        }
      }
    }
  }
}
</style>

```

### 7-7 搜索页面 Suggest 组件开发（05）

当进行搜索时候，假如当前数据比较少，就去不断的请求。那么填充过程中，没有填充完成我就退出了，会发现请求还是不断的发送，所以要判断

```js
async function searchFirst() {
      if (!props.query) {
        return
      }
    }

    async function searchMore() {
      if (!hasMore.value || !props.query) {
        return
      }
    }
```

当搜索时会出现两个loadding图标，这是因为首次进入的时候一次loadding效果，第二次是 better-scroll 内部做的处理，因为better-scroll 此时也是满足滚动的所以就有loadding 效果。

当首次进入歌曲正在填满过程中也不希望用户可以上拉加载，这样可能会触发其他问题。要做一些限制

分析： 首次请求 loadding 为 true的时候和执行makeItScrollable()的时候不去触发上拉加载

```js
 const preventPullUpLoad = computed(() => {
      return loading.value || manualLoading.value
    })
    
     async function makeItScrollable() {
      // 如果大于等于-1 不可滚动
      if (scroll.value.maxScrollY >= -1) {
        manualLoading.value = true
        await searchMore()
        manualLoading.value = false
      }
    }
```

```js
 onMounted(() => {
        const scrollVal = scroll.value = new BScroll(rootRef.value, {
            pullUpLoad: true,
            observeDOM: true,
            click: true
        })
        scrollVal.on('pullingUp', pullingUpHandler)

        async function pullingUpHandler() {
            if (preventPullUpLoad.value) {
                scrollVal.finishPullUp()
                return
            }
            isPullUpLoad.value = true
            await requestData()
            scrollVal.finishPullUp() // 告诉 better-scroll 上拉结束
            scrollVal.refresh()
            isPullUpLoad.value = false
        }
    })
```

### 7-8 搜索页面 Suggest 组件开发（06）

点击功能：当点击歌手和歌曲是不一样的功能

当点击歌曲时添加一首歌曲

```js
 function selectSong(song) {
      store.dispatch('addSong', song)
    }
```



```Js
export function addSong({ commit, state }, song) {
    const playlist = state.playlist.slice()
    const sequenceList = state.sequenceList.slice()
    let currentIndex = state.currentIndex
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

```

### 7-9 搜索页面 Suggest 组件开发（07）

实现歌手点击相关逻辑

```js
@click="selectSinger(singer)"

function selectSinger(singer) {
      emit('select-singer', singer)
    }
```

```vue
  <router-view v-slot="{ Component }">
      <transition appear name="slide">
        <component :is="Component" :data="selectedSinger" />
      </transition>
    </router-view>
```

```js
function selectSinger(singer) {
      selectedSinger.value = singer
      cacheSinger(singer)

      router.push({
        path: `/search/${singer.mid}`
      })
    }

    function cacheSinger(singer) {
      storage.session.set(SINGER_KEY, singer)
    }
```

### 7-10 搜索页面搜索历史功能开发（01）

开发搜索历史功能，保存到本地存储中

use-search-history.js

```js
import { save } from '@/assets/js/array-store'
import { SEARCH_KEY } from '@/assets/js/constant'

import { useStore } from 'vuex'

export default function useSearchHistory() {
    const maxLen = 200
    const store = useStore()

    function saveSearch(query) {
        const searches = save(query, SEARCH_KEY, (item) => {
            return item === query
        }, maxLen)
        store.commit('setSearchHistory', searches)
    }

    return { saveSearch }
}

```

```js
 function selectSong(song) {
      saveSearch(query.value)
      store.dispatch('addSong', song)
    }

    function selectSinger(singer) {
      saveSearch(query.value)
      selectedSinger.value = singer
      cacheSinger(singer)

      router.push({
        path: `/search/${singer.mid}`
      })
    }
```

### 7-11 搜索页面搜索历史功能开发（02）

点击搜索历史关键字的时候，填充到搜索框中，删除搜索历史功能

```vue
 <search-list
          :searches="searchHistory"
          @select="addQuery"
          @delete="deleteSearch"
        />
      </div>
```



```js
 function deleteSearch(query) {
        const searches = remove(SEARCH_KEY, (item) => {
            return item === query
        })
        store.commit('setSearchHistory', searches)
    }
```

### 7-12 搜索页面搜索历史功能开发（03）

解决 ：当搜索列表足够一屏的时候不能滚动问题

```js
       watch(query, async (newQuery) => {
      if (!newQuery) {
        await nextTick()
        refreshScroll()
      }
    })

   
   function refreshScroll() {
      scrollRef.value.scroll.refresh()
    }

```

### 8-1 添加歌曲到列表功能开发（01）

### 8-2 添加歌曲到列表功能开发（02）

### 8-3 添加歌曲到列表功能开发（03）

add-song.vue

```vue
<template>
  <teleport to="body">
    <transition name="slide">
      <div class="add-song" v-show="visible">
        <div class="header">
          <h1 class="title">添加歌曲到列表</h1>
          <div class="cose" @click="hide">
            <i class="icon-close"></i>
          </div>
        </div>
        <div class="search-input-wrapper">
          <search-input placeholder="搜索歌曲" v-model="query" />
        </div>
        <div v-show="!query">
          <switches
            :items="['最近播放', '搜索历史']"
            v-model="currentIndex"
          ></switches>
          <div class="list-wrapper">
            <scroll
              class="list-scroll"
              ref="scrollRef"
              v-if="currentIndex === 0"
            >
              <div class="list-inner">
                <song-list
                  :songs="playHistory"
                  @select="selectSongBySongList"
                ></song-list>
              </div>
            </scroll>
            <scroll
              class="list-scroll"
              ref="scrollRef"
              v-if="currentIndex === 1"
            >
              <div class="list-inner">
                <div class="search-list">
                  <search-list
                    :searches="searchHistory"
                    @select="addQuery"
                    :show-delete="false"
                  />
                </div>
              </div>
            </scroll>
          </div>
        </div>
        <div class="search-result" v-show="query">
          <suggest :query="query" :show-singer="false" />
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script>
import SearchInput from '@/components/search/search-input'
import Suggest from '@/components/search/suggest'
import Switches from '@/components/base/switches/switches'
import Scroll from '@/components/base/scroll/scroll'
import SearchList from '@/components/base/search-list/search-list'
import SongList from '@/components/base/song-list/song-list'
import { ref } from '@vue/reactivity'
import { computed, nextTick } from '@vue/runtime-core'
import { useStore } from 'vuex'

export default {
  components: {
    SearchInput,
    Switches,
    Scroll,
    SearchList,
    SongList,
    Suggest
  },
  setup() {
    // data
    const currentIndex = ref(0)
    const query = ref('')
    const visible = ref(false)
    const scrollRef = ref(null)

    // computed
    const store = useStore()
    const searchHistory = computed(() => store.state.searchHistory)
    const playHistory = computed(() => store.state.playHistory)

    // methods
    function addQuery(s) {
      query.value = s
    }
    function hide() {
      visible.value = false
    }
    async function show() {
      visible.value = true
      await nextTick()
      refreshScroll()
    }
    function selectSongBySongList({ song }) {
      addSong(song)
    }
    function addSong(song) {
      store.dispatch('addSong', song)
    }
    function refreshScroll() {
      scrollRef.value.scroll.refresh()
    }
    return {
      // data
      currentIndex,
      visible,
      scrollRef,
      query,
      // computed
      searchHistory,
      playHistory,
      // methods
      addQuery,
      hide,
      show,
      refreshScroll,
      selectSongBySongList
    }
  }
}
</script>

<style lang="scss" scoped>
.add-song {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 100%;
  z-index: 300;
  background: $color-background;
  .header {
    position: relative;
    height: 44px;
    text-align: center;
    .title {
      line-height: 44px;
      font-size: $font-size-large;
      color: $color-text;
    }
    .close {
      position: absolute;
      top: 0;
      right: 8px;
      .icon-close {
        display: block;
        padding: 12px;
        font-size: 20px;
        color: $color-theme;
      }
    }
  }
  .search-input-wrapper {
    margin: 20px;
  }
  .search-result {
    position: fixed;
    top: 124px;
    bottom: 0;
    width: 100%;
  }
  .list-wrapper {
    position: absolute;
    top: 165px;
    bottom: 0;
    width: 100%;
    .list-scroll {
      height: 100%;
      overflow: hidden;
      .list-inner {
        padding: 20px 30px;
      }
      &.test-enter-active,
      &.test-leave-active {
        transition: all 0.3s;
      }
      &.test-enter-from,
      &.test-leave-to {
        transform: translateX(100%);
      }
    }
  }
}
</style>

```

switches.vue

```vue
<template>
  <ul class="switches">
    <li
      class="switch-item"
      v-for="(item, index) in items"
      :key="item"
      :class="{ active: modelValue === index }"
      @click="switchItem(index)"
    >
      <span>{{ item }}</span>
    </li>
    <div class="active-bar" :style="activeStyle"></div>
  </ul>
</template>

<script>
export default {
  name: 'switches',
  props: {
    items: {
      type: Array,
      default() {
        return []
      }
    },
    modelValue: {
      type: Number,
      default: 0
    }
  },
  computed: {
    activeStyle() {
      const x = 120 * this.modelValue
      return {
        transform: `translate3d(${x}px, 0, 0)`
      }
    }
  },
  methods: {
    switchItem(index) {
      this.$emit('update:modelValue', index)
    }
  }
}
</script>

<style scoped lang="scss">
.switches {
  display: flex;
  position: relative;
  align-items: center;
  width: 240px;
  margin: 0 auto;
  border: 1px solid $color-highlight-background;
  border-radius: 5px;
  .switch-item {
    position: relative;
    z-index: 10;
    flex: 1;
    height: 30px;
    line-height: 30px;
    text-align: center;
    font-size: $font-size-medium;
    color: $color-text-d;
    &.active {
      color: $color-text;
    }
  }
  .active-bar {
    position: absolute;
    left: 0;
    top: 0;
    width: 120px;
    height: 30px;
    transition: transform 0.3s;
    border-radius: 5px;
    background: $color-highlight-background;
  }
}
</style>

```

### 8-4 添加歌曲到列表功能开发（04）

当点击最近播放时，是可以正常播放的，但是会有个问题，当点击对应的歌曲在播放列表中没有变为第一个，对于需求而已因为是最近播放，所以是列表第一个，因为 inertArray 中判断为 index > 1 所以什么都没有做。所以顺序没有变化， 所以先删除掉，再添加上

```js
function inertArray(arr, val, compare, maxLen) {
    const index = arr.findIndex(compare) // -1
    if (index === 0) {
        return
    }
    if (index > 0) {
        return
    }
    arr.unshift(val) // 插入array第一项
    // 收藏最大值
    if (maxLen && arr.length > maxLen) {
        arr.pop() // 先进先出
    }
}
```

### 8-5 添加歌曲到列表功能开发（05）

message.vue

```vue
<template>
  <teleport to="body">
    <transition name="slide-down">
      <div class="message" v-if="visible" @click="hide">
        <slot></slot>
      </div>
    </transition>
  </teleport>
</template>

<script>
export default {
  name: 'message',
  props: {
    delay: {
      type: Number,
      default: 2000
    }
  },
  data() {
    return {
      visible: false
    }
  },
  methods: {
    show() {
      clearTimeout(this.timer)
      this.visible = true
      this.timer = setTimeout(() => {
        this.hide()
      }, this.delay)
    },
    hide() {
      clearTimeout(this.timer)
      this.visible = false
    }
  }
}
</script>

<style scoped lang="scss">
.message {
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 400;
  background: $color-dialog-background;

  &.slide-down-enter-active,
  &.slide-down-leave-active {
    transition: all 0.3s;
  }

  &.slide-down-enter-from,
  &.slide-down-leave-to {
    transform: translate3d(0, -100%, 0);
  }
}
</style>

```

### 8-6 用户中心页面开发（01）

有我喜欢的和最近播放的歌曲列表

```vue
<template>
  <div class="user-center" v-no-result:[noResultText]="noResult">
    <div class="back" @click="back">
      <i class="icon-back"></i>
    </div>
    <div class="switches-wrapper">
      <switches :items="['我喜欢的', '最近播放']" v-model="currentIndex" />
    </div>
    <div class="play-btn" v-if="currentList.length" @click="random">
      <i class="icon-play"></i>
      <span class="text">随机播放全部</span>
    </div>
    <div class="list-wrapper">
      <scroll class="list-scroll" v-if="currentIndex === 0">
        <div class="list-inner">
          <song-list :songs="favoriteList" @select="selectSong" />
        </div>
      </scroll>
      <scroll class="list-scroll" v-if="currentIndex === 1">
        <div class="list-inner">
          <song-list :songs="playHistory" @select="selectSong" />
        </div>
      </scroll>
    </div>
  </div>
</template>

<script>
import Switches from '@/components/base/switches/switches'
import Scroll from '@/components/wrap-scroll'
import SongList from '@/components/base/song-list/song-list'
import { ref } from '@vue/reactivity'
import { useStore } from 'vuex'
import { computed } from '@vue/runtime-core'
import { useRouter } from 'vue-router'
export default {
  components: {
    Switches,
    Scroll,
    SongList
  },
  setup() {
    // data
    const currentIndex = ref(0)
    const router = useRouter()
    // computed
    const store = useStore()
    const favoriteList = computed(() => store.state.favoriteList)
    const playHistory = computed(() => store.state.playHistory)
    const noResultText = computed(() => currentIndex.value === 0 ? '暂无收藏歌曲' : '你还没有听过歌曲')
    const noResult = computed(() => {
      return currentIndex.value === 0 ? !favoriteList.value.length : !playHistory.value.length
    })
    const currentList = computed(() => {
      return currentIndex.value === 0 ? favoriteList.value : playHistory.value
    })

    // methods
    function back() {
      router.back()
    }
    function selectSong({ song }) {
      store.dispatch('addSong', song)
    }
    function random() {
      store.dispatch('randomPlay', currentList.value)
    }
    return {
      // data
      currentIndex,
      noResultText,
      // computed
      playHistory,
      favoriteList,
      noResult,
      currentList,
      // methods
      back,
      selectSong,
      random
    }
  }
}
</script>

<style lang="scss" scoped>
.user-center {
  position: fixed;
  top: 0;
  bottom: 0;
  z-index: 100;
  left: 0;
  right: 0;
  width: 100%;
  background: $color-background;
  padding-top: 5px;
  .back {
    position: absolute;
    top: 5px;
    left: 6px;
    z-index: 50;
    display: flex;
    .icon-back {
      display: block;
      padding: 10px;
      font-size: $font-size-large-x;
      color: $color-theme;
    }
  }
  .switches-wrapper {
    margin: 5px 0 30px 0;
  }
  .play-btn {
    box-sizing: border-box;
    width: 135px;
    padding: 7px 0;
    margin: 0 auto;
    text-align: center;
    border: 1px solid $color-text-l;
    color: $color-text-l;
    border-radius: 100px;
    font-size: 0;
    .icon-play {
      display: inline-block;
      vertical-align: middle;
      margin-right: 6px;
      font-size: $font-size-medium-x;
    }
    .text {
      display: inline-block;
      vertical-align: middle;
      font-size: $font-size-small;
    }
  }
  .list-wrapper {
    position: absolute;
    top: 120px;
    bottom: 0;
    width: 100%;
    .list-scroll {
      height: 100%;
      overflow: hidden;
      .list-inner {
        padding: 20px 30px;
      }
    }
  }
}
</style>

```

### 8-7 用户中心页面开发（02）

因为收藏和历史数据都是本地缓存的数据，歌曲对象的url可能是过期的，还有就是切换没有过渡效果

解决：在应用程序初始化的时候从本地存储中读取歌曲列表，然后去批量处理歌曲，请求最新的url

```js
const favoriteSongs = load(FAVORITE_KEY)
if (favoriteSongs.length > 0) {
  processSongs(favoriteSongs).then(songs => {
    store.commit('setFavoriteList', songs)
  })
}
const historySongs = load(PLAY_KEY)
if (historySongs.length > 0) {
  processSongs(historySongs).then((songs) => {
    store.commit('setPlayHistory', songs)
    saveAll(songs, PLAY_KEY)
  })
}
```

### 8-8 用户中心页面开发（03）

路由视图切换过渡效果

```html
<template>
  <m-header />
  <tab />
  <router-view v-slot="{ Component }" :style="viewStyle">
    <transition appear name="slide">
      <component :is="Component" />
    </transition>
  </router-view>
  <player></player>
</template>
```

此时存在问题，因为这个是一级路由，除了个人中心路由，其他一级路由都是有过渡效果的，所以动画比较乱

解决： 把两种类型的路由分开，通过命名视图 ，通过个人中心和router-view 和 其他的router-view 分开

```html
<template>
  <m-header />
  <tab />
  <router-view :style="viewStyle" />
  <router-view v-slot="{ Component }" name="user" :style="viewStyle">
    <transition appear name="slide">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </transition>
  </router-view>
  <player></player>
</template>
```

```js
{
  path: '/user',
  components: {
    user: UserCenter
  }
```

### 9-1 keep-alive 组件应用

```html
<template>
  <m-header />
  <tab />
  <router-view :style="viewStyle" v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </router-view>
  <router-view v-slot="{ Component }" name="user" :style="viewStyle">
    <transition appear name="slide">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </transition>
  </router-view>
  <player></player>
</template>
```

注意 用了 keep-alive 

```js
onUnmounted(() => {
    scroll.value.destroy()
  }) // 不会触发
```

所以 用 onActivated onDeactivated 这两个生命周期

```js
    // 被包含在中的组件，会多出两个生命周期钩子函数。被激活时执行。
    onActivated(() => {
        scroll.value.enable()
        scroll.value.refresh()
    })
    // 比如从 A 组件，切换到 B 组件，A 组件消失时执行。
    onDeactivated(() => {
        scroll.value.disable()
    })
```

这里说明一定要去禁用better-scroll，比如在滚动过程中，切换了页面，此时不去清除实例或者禁用就会继续滚动，会出现奇奇怪怪的bug

### 

