<template>
  <m-header />
  <tab />
  <router-view />
</template>
<script>
import Header from '@/components/header/header.vue'
import Tab from '@/components/tab/tab.vue'
import { mapState } from 'vuex'

export default {
  components: {
    MHeader: Header,
    Tab
  },
  computed: {
    ...mapState(['playlist']),
    viewStyle() {
      const bottom = this.playlist.length ? '60px' : '0'
      return {
        bottom
      }
    }
  },
  created() {
    const router = this.$router.options.routes
    const routerLink = router
      .map((item) => {
        return item.path
      })
      .filter((item) => {
        return item !== '/'
      })
    this.$store.commit('setRouterLink', routerLink)
  }
}
</script>
<style lang="scss"></style>
