import Vue from 'vue'
// import Vuex from 'vuex'
import Vuex from '../example/myvuex/index.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    name:'kebi'
  },
  getters: {
    myName(state){
      return state.name + '666';
    }
  },
  mutations: {
  },
  actions: {
  },
  modules: {
  }
})
