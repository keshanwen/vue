import Vue from 'vue'
// import Vuex from 'vuex'
import Vuex from '../example/myvuex/index.js'

Vue.use(Vuex)

export default new Vuex.Store({
  // 用于保存全局共享的数据
  state: {
    name:'kebi',
    num:0,
    age: 0
  },
  getters: {
    myName(state){
      return state.name + '666';
    }
  },
  // 用于同步修改共享数据
  mutations: {
    addNum(state, payload){
      console.log(state, payload);
      state.num += payload;
    },
    addAge(state, payload){
      state.age += payload;
    }
  },
  // 用于异步修改共享数据
  actions: {
    asyncAddAge({commit}, payload){
      setTimeout(()=>{
        commit('addAge', payload);
      }, 1000);
    }
  },
  // 用户模块化共享数据
  modules: {
  }
})
