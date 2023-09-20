import { Vue } from './install'
import { forEach } from './util'
import ModuleCollection from './module/module-collection';

function installModule(store, rootState, path, module) { // a/b/c/d
  // 需要循环当前模块


  // 获取 moduleCollection 类的实例
  let ns = store._modules.getNamespace(path)
  // module.state => 放到 rootState 对应的儿子里
  if (path.length > 0) { // 儿子模块
    // 需要找到对应父模块， 将状态声明上去
    // { name: 'zf', age: '12', a: aState }
    let parent = path.slice(0, -1).reduce((memo, current) => {
      return memo[current]
    }, rootState)
    // 对象新增属性不能导致更新视图
    Vue.set(parent, path[path.length - 1], module.state)
  }

  module.forEachGetter((fn, key) => {
    store.wrapperGetters[ns + key] = function () {
      return fn.call(store, module.state)
    }
  })

  module.forEachMutation((fn, key) => {
    store.mutations[ns + key] = store.mutations[ns + key] || []
    store.mutations[ns + key].push((payload) => {
      // return fn.call(store, module.state, payload)
      fn.call(store, module.state, payload)

      store._subscribes.forEach(fn => fn(
        {
          type: ns + key,
          payload
        },
        store.state
      ))
    })
  })

  module.forEachAction((fn, key) => {
    store.actions[ns + key] = store.actions[ns + key] || []
    store.actions[ns + key].push((payload) => {
      return fn.call(store, store, payload)
    })
  })

  module.forEachChildren((child, key) => {
    installModule(store, rootState, path.concat(key), child)
  })

}


class Store {
  constructor(options) {
    // 对用户的模块进行整合
    // 当前格式化完毕的数据 放到了 this._moduled 里
    this._modules = new ModuleCollection(options) // 对用户的参数进行格式化操作

    this.wrapperGetters = {}
    this.getters = {} // 我需要将模块中的所有getters  mutations  actions 进行收集
    this.mutations = {}
    this.actions = {}
    this._subscribes = []
    const computed = {}
    // 没有 namespace 的时候 getters 都放在根上， actions, mutations 会被合并数组
    let state = options.state
    installModule(this, state, [], this._modules.root)
    forEach(this.wrapperGetters, (getter, key) => {
      computed[key] = getter
      Object.defineProperty(this.getters, key, {
        get: () => this._vm[key]
      })
    })

    this._vm = new Vue({
      data: {
        $$state: state
      },
      computed
    })

    if (options.plugins) { // 说明用户使用了插件
      options.plugins.forEach( plugin => plugin(this))
    }
  }
  /*
    用户组件中使用 $store = this
    this.$store.state = defineProperty中的get
    类的属性访问器
  */
  get state() {
    // 依赖于  vue 的响应式原理
    return this._vm._data.$$state
  }
  subscribe(fn) {
    this._subscribes.push(fn)
  }
  commit = (mutationName, payload) => {
    this.mutations[mutationName] && this.mutations[mutationName].forEach( fn => fn(payload))
  }
  dispatch = (actionName, payload) => { // 根据 cmmit 还是 dispatch 找对应的存储结果
    this.actions[actionName] && this.actions[actionName].forEach( fn => fn(payload))
  }

}

export default Store