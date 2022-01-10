<template>
  <div id="app">
    <p>{{this.$store.state.globalName}}</p>
    <p>{{this.$store.getters.getGlobalName}}</p>
    <button @click="globalFn1">同步操作</button>
    <button @click="globalFn2">异步操作</button>
    <hr>
    <p>{{this.$store.state.home.name}}</p>
    <!--注意点: 如果获取的是模块中state共享的数据, 那么需要加上模块的名称-->
    <!--注意点: 如果获取的是模块中getters共享的数据, 那么不需要加上模块的名称-->
    <p>{{this.$store.getters.getHomeName}}</p>
    <button @click="homeFn1">同步操作</button>
    <button @click="homeFn2">异步操作</button>
    <hr>
    <p>{{this.$store.state.account.name}}</p>
    <!-- <p>{{this.$store.getters.getAccountName}}</p> -->
    <button @click="accountFn1">同步操作</button>
    <button @click="accountFn2">异步操作</button>
    <hr>
    <p>{{this.$store.state.account.login.name}}</p>
    <p>{{this.$store.getters.getLoginName}}</p>
    <button @click="loginFn1">同步操作</button>
    <button @click="loginFn2">异步操作</button>
  </div>
</template>

<script>


export default {
  name: 'myvuex',
  mounted() {
    console.log(this.$store);
  this.demo()
  },
  methods: {
    first(time) {
      return new Promise( (res,rej) => {
        setTimeout(() => {
          res()
        },time)
      })
    },
    demo() {
      this.demo1('params~demo1')
      this.demo2('params~demo2')
      this.demo3('params~demo3')
    },
    async demo1(params) {
      await this.first(3000)
      this.$nextTick( () => {
        console.log(params,'~~~demo1')
      })
    },
    async demo2(params) {
      await this.first(2000)
      this.$nextTick( () => {
        console.log(params,'~~~demo2')
      })
    },
    async demo3(params) {
      await this.first(1000)
      this.$nextTick( () => {
        console.log(params,'~~~demo3')
      })
    },
    globalFn1(){
      this.$store.commit('changeGlobalName', 10);
    },
    globalFn2(){
      this.$store.dispatch('asyncChangeGlobalName', 5);
    },
    homeFn1(){
      this.$store.commit('changeHomeName', 10);
    },
    homeFn2(){
      this.$store.dispatch('asyncChangeHomeName', 5);
    },
    accountFn1(){
      this.$store.commit('changeAccountName', 10);
    },
    accountFn2(){
      this.$store.dispatch('asyncChangeAccountName', 5);
    },
    loginFn1(){
      this.$store.commit('changeLoginName', 10);
    },
    loginFn2(){
      this.$store.dispatch('asyncChangeLoginName', 5);
    }
  }
}
</script>

<style>
</style>
