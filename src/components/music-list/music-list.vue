<template>
  <div class="music-list">
    <div
      class="back"
      @click="goBack"
    >
      <i class="icon-back"></i>
    </div>
    <h1 class="title">{{ title }}</h1>
    <div
      class="bg-image"
      :style="bgImageStyle"
      ref="bgImage"
    >
      <div
        class="play-btn-wrapper"
        :style="playBtnStyle"
      >
        <div
          v-show="songs.length > 0"
          class="play-btn"
          @click="random"
        >
          <i class="icon-play"></i>
          <span class="text">随机播放全部</span>
        </div>
      </div>
      <div
        class="filter"
        :style="filterStyle"
      ></div>
    </div>
    <scroll
      class="list"
      :style="scrollStyle"
      v-loading="loading"
      v-no-result:[noResultText]="noResult"
      :probe-type="3"
      @scroll="onScroll"
    >
      <div class="song-list-wrapper">
        <song-list
          :songs="songs"
          @select="selectItem"
          :rank="rank"
        ></song-list>
      </div>
    </scroll>
  </div>
</template>

<script>
  import SongList from '@/components/base/song-list/song-list'
  import Scroll from '@/components/wrap-scroll'
  import { mapActions, mapState } from 'vuex'

  // 顶部高
  const RESERVED_HEIGHT = 40

  export default {
    name: 'music-list',
    components: {
      SongList,
      Scroll
    },
    props: {
      songs: {
        type: Array,
        default() {
          return []
        }
      },
      title: String,
      pic: String,
      loading: Boolean,
      noResultText: {
        type: String,
        default: '抱歉，没有找到可播放的歌曲'
      },
      rank: Boolean
    },
    data() {
      return {
        imageHeight: 0, // 动态获取图片高度
        scrollY: 0,
        maxTranslateY: 0 // 可以滚动的最大高度
      }
    },
    // 在计算属性中,使用的变量大于一次的时候,要使用临时变量缓存，每次执行this.xxx的时候会执行依赖收集
    computed: {
      noResult() {
        return !this.loading && !this.songs.length
      },
      playBtnStyle() {
        let display = ''
        // 如果scrollY超过那个位置
        if (this.scrollY >= this.maxTranslateY) {
          display = 'none'
        }
        return {
          display
        }
      },
      bgImageStyle() {
        const scrollY = this.scrollY
        let zIndex = 0
        let paddingTop = '70%'// 正常情况下，把图片撑起来的
        let height = 0
        let translateZ = 0 // 解决iOS兼容性问题,移得更近，更远

        // 如果scrollY超过那个位置 把图片层级设高，因为现在的高是通过padding-top撑起来的，所以把padding-top设置为0
        if (scrollY > this.maxTranslateY) {
          zIndex = 10 // 改变图片层级
          paddingTop = 0
          height = `${RESERVED_HEIGHT}px` // 设置高
          translateZ = 1
        }

        // 下拉缩放
        let scale = 1
        if (scrollY < 0) {
          scale = 1 + Math.abs(scrollY / this.imageHeight)
        }

        return {
          zIndex,
          paddingTop,
          height,
          backgroundImage: `url(${this.pic})`,
          transform: `scale(${scale})translateZ(${translateZ}px)`
        }
      },
      scrollStyle() {
        const bottom = this.playlist.length ? '60px' : '0'
        return {
          top: `${this.imageHeight}px`, // 留照片的高度
          bottom
        }
      },
      filterStyle() {
        let blur = 0 // 默认是不模糊的
        const scrollY = this.scrollY
        const imageHeight = this.imageHeight
        // 监听scrollY去动态设置值，向上推，值是正的，向下拉，值是负的
        if (scrollY >= 0) {
          // 返回最小值，滚动到上面是有个最大值的，不能超过最大值，所以我们取最小值，
          blur = Math.min(this.maxTranslateY / imageHeight, scrollY / imageHeight) * 20
        }
        return {
          // 滤镜, 模糊效果
          backdropFilter: `blur(${blur}px)`
        }
      },
      ...mapState([
        'playlist'
      ])
    },
    mounted() {
      // 获取图片高度
      this.imageHeight = this.$refs.bgImage.clientHeight
      // 可以滚动的最大高度
      this.maxTranslateY = this.imageHeight - RESERVED_HEIGHT
    },
    methods: {
      goBack() {
        this.$router.back()
      },
      onScroll(pos) {
        this.scrollY = -pos.y
      },
      selectItem({ song, index }) {
        this.selectPlay({
          list: this.songs,
          index
        })
      },
      random() {
        this.randomPlay(this.songs)
      },
      ...mapActions([
        'selectPlay',
        'randomPlay'
      ])
    }
  }
</script>

<style lang="scss" scoped>
  .music-list {
    position: relative;
    height: 100%;
    .back {
      position: absolute;
      top: 0;
      left: 6px;
      z-index: 20;
      transform: translateZ(2px);
      .icon-back {
        display: block;
        padding: 10px;
        font-size: $font-size-large-x;
        color: $color-theme;
      }
    }
    .title {
      position: absolute;
      top: 0;
      left: 10%;
      width: 80%;
      z-index: 20;
      transform: translateZ(2px);
      @include no-wrap();
      text-align: center;
      line-height: 40px;
      font-size: $font-size-large;
      color: $color-text;
    }
    .bg-image {
      position: relative;
      width: 100%;
      transform-origin: top;
      background-size: cover;
      .play-btn-wrapper {
        position: absolute;
        bottom: 20px;
        z-index: 10;
        width: 100%;
        .play-btn {
          box-sizing: border-box;
          width: 135px;
          padding: 7px 0;
          margin: 0 auto;
          text-align: center;
          border: 1px solid $color-theme;
          color: $color-theme;
          border-radius: 100px;
          font-size: 0;
        }
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
      .filter {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(7, 17, 27, 0.4);
      }
    }
    .list {
      position: absolute;
      bottom: 0;
      width: 100%;
      z-index: 0;
      .song-list-wrapper {
        padding: 20px 30px;
        background: $color-background;
      }
    }
  }
</style>
