<template>
  <div>推荐</div>
</template>

<script>
import { getRecommend } from '@/service/recommend'

export default {
  name: 'recommend',
  data() {
    return {
      sliders: [],
      albums: [],
      selectedAlbum: null
    }
  },
  async created() {
    const result = await getRecommend()
    console.log(result)
    this.sliders = result.sliders
    this.albums = result.albums
  }
}
</script>

<style scoped></style>
