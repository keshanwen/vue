<template>
    <div class="home">
      <div class="left">
        <LeftNav/>
      </div>
      
      <div class="right">
        <!-- <div class="right-header">
          <Header/>
        </div> -->
        <router-view/>
      </div>
    </div>
</template>

<script>
import LeftNav from '@/components/leftNav'
import Header from '@/components/header'

export default {
  name: 'Home',

  components: {
    LeftNav,
    Header
  }
 
}
</script>

<style lang="less" scoped>
.home {
  display: flex;
  height: 100vh;
  .left {
    width: 240px;
    border-right: 1px solid darkgrey;
  }
  .right {
    flex: 1;
    padding: 20px;
    .right-header {
      height: 120px;
      border-bottom: 1px solid blueviolet;
    }
  }
}
</style>
