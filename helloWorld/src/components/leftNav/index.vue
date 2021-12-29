<template>
  <div class="left-nav-home">
    <router-link v-for="item in list" :to="item.url" :key="item.url" class="left-nav-item mb-20">
      {{ item.name }}
    </router-link>
  </div>
</template>

<script>
export default {
  name: 'leftNav',
  data() {
    return {
      list: [
        {name: '左右伸缩',url: 'leftRightDrag'},
        {name: 'vuex',url: 'vuexDemo'},
        {name: 'table',url: 'table'},
      ]
    }
  }
}
</script>

<style lang="less" scoped>
.left-nav-home {
  padding: 20px;
  .left-nav-item {
    display: block;
  }
  .mb-20 {
    margin-bottom: 20px;
  }
}
</style>