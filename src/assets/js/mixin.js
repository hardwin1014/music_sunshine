import { mapState } from 'vuex'

export const fingerMixin = {
  async created() {
    this.touch = {}
    const index = this.routeLink.findIndex((item) => item === this.$route.path)
    this.$store.commit('setCurrentPageIndex', index)
  },
  computed: {
    ...mapState(['routeLink', 'currentPageIndex'])
  },
  methods: {
    onTouchStart(e) {
      this.touch.x1 = e.touches[0].pageX
    },
    onTouchMove(e) {
      const delta = e.touches[0].pageX - this.touch.x1
      const progress = Math.min(1, delta / window.innerWidth)
      this.touch.progress = progress
    },
    onTouchEnd() {
      const { progress } = this.touch
      let index = this.currentPageIndex

      if (progress <= -0.3) {
        if (index >= 3) return
        index++
        this.$store.commit('setCurrentPageIndex', index)
        this.$router.push({ path: this.routeLink[index] })
      } else if (progress >= 0.3) {
        if (this.currentPageIndex === 0) return
        index--
        this.$store.commit('setCurrentPageIndex', index)
        this.$router.push({ path: this.routeLink[index] })
      }
      this.touch = {}
    }
  }
}
