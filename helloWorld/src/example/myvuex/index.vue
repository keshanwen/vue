<template>
   <div>
     i am vuex demo
     <h1>
       {{ this.$store.state.num }}
     </h1>
     <button @click="add">点我</button>
      <p>{{this.$store.state.age}}</p>
    <button @click="myFn2">我是按钮2</button>
   </div>
</template>

<script>
export default {
  name: 'myVuex',

  mounted () {
    console.log(this.$store)
  },

  methods: {
    add() {
      this.$store.commit('addNum',10)
    },
    myFn2(){
      this.$store.dispatch('asyncAddAge', 5);
    }
  }
}
</script>

<style>

</style>