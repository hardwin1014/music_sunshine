import storage from 'good-storage'
import { processSongs } from '@/service/song'
import MusicList from '@/components/music-list/music-list'

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
        const { data } = this
        if (data) {
          ret = data
        } else {
          // 防止刷新失去数据
          const cacheSinger = storage.session.get(key)
          // 如果歌手的ID和路由上的ID相等，那么就取值
          if (cacheSinger && (cacheSinger.mid || `${cacheSinger.id}`) === this.$route.params.id) {
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
        // 如果数据为null，退回到一级路由, 下面的不执行
        const { path } = this.$route.matched[0] // 第一个匹配的路径
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
