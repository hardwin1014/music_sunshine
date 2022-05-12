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
          const cacheSinger = storage.session.get(key)
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
        const { path } = this.$route.matched[0]
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
