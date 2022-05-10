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
