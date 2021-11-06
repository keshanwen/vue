<template>
   <div>
     i am vuex demo
     <h1>
       {{ this.$store.state.num }}
     </h1>
     <button @click="add">点我</button>
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
    }
  }
}
</script>

<style>

</style>