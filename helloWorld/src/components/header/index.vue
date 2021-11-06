<template>
  <div class="header-home">
    <div class="headre-item">
      <button class="mr-10" @click="beginStudy">开始学习</button>
       <button @click="endStudy">结束学习</button>
       <div class="mt-10">开始时间</div>
       <div class="study-time mt-10">{{ beginStudyTime }}</div>
    </div>
    <div class="headre-item">
     
    </div>
    <div class="headre-item">
      学习记录
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      beginStudyTime: null
    }
  },

  methods: {
    // 开始学习
    beginStudy() {

    },
    // 结束学习
    endStudy() {

    }
  }
}
</script>

<style lang="less" scoped>
.header-home {
  display: flex;
  height: 100%;
  .headre-item {
    flex: 1;
    padding: 8px;
    text-align: left;
    border-right: 1px solid red;
    .study-time {
      font-size: 20px;
      color: red;
    }
  }
  .mr-10 {
    margin-right: 10px;
  }
  .mt-10 {
    margin-top: 10px;
  }
}
</style>