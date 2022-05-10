<template>
  <div class="singer-detail">
    <music-list :songs="songs" :title="title" :pic="pic" :loading="loading" />
  </div>
</template>

<script>
// import MusicList from '@/components/music-list/music-list.vue'
import createDetailComponent from '@/assets/js/create-detail-component'
import { getSingerDetail } from '@/service/singer'
// import { processSongs } from '@/service/song'
import { SINGER_KEY } from '@/assets/js/constant'

export default createDetailComponent('singer-detail', SINGER_KEY, getSingerDetail)
// import { SINGER_KEY } from '@/assets/js/constant'
// import storage from 'good-storage'
// export default {
//   name: 'singer-detail',
//   props: {
//     singer: Object
//   },
//   components: {
//     MusicList
//   },
//   data() {
//     return {
//       songs: null,
//       loading: true
//     }
//   },
//   computed: {
//     computedData() {
//       let ret = null
//       const singer = this.singer
//       if (singer) {
//         return singer
//       } else {
//         const cacheSinger = storage.session.get(SINGER_KEY)
//         if (cacheSinger && cacheSinger.mid === this.$route.params.id) {
//           ret = cacheSinger
//         }
//       }
//       return ret
//     },
//     pic() {
//       const singer = this.computedData
//       return singer && singer.pic
//     },
//     title() {
//       const singer = this.computedData
//       return singer && singer.name
//     }
//   },
//   async created() {
//     if (!this.computedData) {
//       const path = this.$route.matched[0].path
//       this.$router.push({ path })
//     }
//     const result = await getSingerDetail(this.computedData)
//     const songs = await processSongs(result.songs)
//     this.songs = songs
//     this.loading = false
//   }
// }
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
