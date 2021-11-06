import Vue from 'vue'
import Vuex from 'vuex'
// import Vuex from '../example/myvuex/index.js'
Vue.use(Vuex)
let home = {
  state: {
    name: 'www'
  },
  getters: {
    getHomeName(state){
      return state.name + '222222';
    },
    // 多个模块中不能出现同名的getters方法
    // getGlobalName(state){
    //   return state.globalName + '111111';
    // }
  },
  mutations: {
    changeHomeName(state, payload){
      state.name += payload;
    },
    // 注意点: 多个模块的mutations中可以出现同名的方法
    //         多个同名的方法不会覆盖, 会放到数组中然后依次执行
    changeGlobalName(state, payload){
      console.log('home中的changeGlobalName');
      state.globalName += payload;
    }
  },
  actions: {
    asyncChangeHomeName({commit}, payload){
      setTimeout(()=>{
        commit('changeHomeName', payload);
      }, 1000);
    },
    // 注意点: 多个模块的actions中可以出现同名的方法
    //         多个同名的方法不会覆盖, 会放到数组中然后依次执行
    asyncChangeGlobalName({commit}, payload){
      console.log('home中的asyncChangeGlobalName');
      setTimeout(()=>{
        commit('changeGlobalName', payload);
      }, 1000);
    }
  }
}
let login = {
  state: {
    name: 'com'
  },
  getters: {
    getLoginName(state){
      return state.name + '333333';
    }
  },
  mutations: {
    changeLoginName(state, payload){
      state.name += payload;
    }
  },
  actions: {
    asyncChangeLoginName({commit}, payload){
      setTimeout(()=>{
        commit('changeLoginName', payload);
      }, 1000);
    }
  },
}
let account = {
  state: {
    name: 'it666'
  },
  getters: {
    getAccountName(state){
      return state.name + '333333';
    }
  },
  mutations: {
    changeAccountName(state, payload){
      state.name += payload;
    }
  },
  actions: {
    asyncChangeAccountName({commit}, payload){
      setTimeout(()=>{
        commit('changeAccountName', payload);
      }, 1000);
    }
  },
  modules: {
    login: login
  }
}
export default new Vuex.Store({
  /*
  1.过去我们将所有模块的数据都放到state中共享, 但是这样会导致命名匮乏的问题
  例如: 我们有三个模块 首页 / 个人中心 / 登录
  首页中需要共享name, 个人中心中也需要共享name / 登录中也需要共享nanme
  并且这三个name的取值还不一样, 那么为了能把这三条数据放到同一个state中, 我们就必须指定不同的名称
  state:{
    homeName: 'www',
    accountName: 'it666',
    loginName: 'com'
  }
  2.为了解决这个问题, Vuex就推出了模块化共享数据
  通过模块化共享数据, 我们可以将不同模块共享的数据放到不同的state中
  * */
  // 用于保存全局共享数据
  state: {
    globalName: 'lnj'
  },
  getters: {
    getGlobalName(state){
      return state.globalName + '111111';
    }
  },
  // 用于同步修改共享数据
  mutations: {
    changeGlobalName(state, payload){
      console.log('全局中的changeGlobalName');
      state.globalName += payload;
    }
  },
  // 用于异步修改共享数据
  actions: {
    asyncChangeGlobalName({commit}, payload){
      console.log('全局中的asyncChangeGlobalName');
      setTimeout(()=>{
        commit('changeGlobalName', payload);
      }, 1000);
    }
  },
  // 用于模块化共享数据
  modules: {
    home:home,
    account: account
  }
})
