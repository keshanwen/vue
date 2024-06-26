import { Vue } from './install'
import { forEach } from './util'
import ModuleCollection from './module/module-collection';

function getNewState(store, path) {
  return path.reduce((memo, current) => {
    return memo[current]
   }, store.state)
}

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
    store._withCommittting(() => {
      Vue.set(parent, path[path.length - 1], module.state)
    })

  }

  module.forEachGetter((fn, key) => {
    store.wrapperGetters[ns + key] = function () {
      return fn.call(store, getNewState(store, path))
    }
  })

  module.forEachMutation((fn, key) => {
    store.mutations[ns + key] = store.mutations[ns + key] || []
    store.mutations[ns + key].push((payload) => {
      // return fn.call(store, module.state, payload)
      store._withCommittting(() => {
        fn.call(store, getNewState(store, path), payload)
      })

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

function resetVM(store, state) {
  let oldVm = store._vm
  store.getters = {}
  const computed = {}
  forEach(store.wrapperGetters, (getter, key) => {
    computed[key] = getter
    Object.defineProperty(store.getters, key, {
      get: () => store._vm[key]
    })
  })
  store._vm = new Vue({
    data: {
      $$state: state
    },
    computed
  })

  if (store.strict) { // 说明是严格模式我要监控状态
    store._vm.$watch(() => store._vm._data.$$state, () => {
      // 我希望状态变化后 直接就能监控到 ， watcher 都是异步的 ？ 状态变化会立即执行， 不是异步 watcher
      console.assert(store._committing, 'no mutate in mutation handler outside')
    }, {
      deep: true,
      sync: true
    })
  }

  // 重新创建实例后， 需要将老的实例卸载掉
  if (oldVm) {
    Vue.nextTick( () => oldVm.$destroy() )
  }
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
    this._committing = false // 默认是不在 mutation 中更改的

    this.strict = options.strict

    // 没有 namespace 的时候 getters 都放在根上， actions, mutations 会被合并数组
    let state = options.state
    installModule(this, state, [], this._modules.root)

    resetVM(this, state)

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
  _withCommittting(fn) {
    this._committing = true
    fn() // 函数是同步的 获取_commiting 就是 true, 如果是异步的那么就会变成 false 就会打印日志
    this._committing = false
  }
  subscribe(fn) {
    this._subscribes.push(fn)
  }
  replaceState(newState) { // 需要替换的状态
    this._withCommittting(() => {
        this._vm._data.$$state = newState // 替换最新的状态， 赋予对象类型会被重新劫持
    })


    // 虽然替换了状态， 但是在 mutation getter中的 state 在初始化的时候 已经被绑定死了老状态
  }
  commit = (mutationName, payload) => {
    this.mutations[mutationName] && this.mutations[mutationName].forEach( fn => fn(payload))
  }
  dispatch = (actionName, payload) => { // 根据 cmmit 还是 dispatch 找对应的存储结果
    this.actions[actionName] && this.actions[actionName].forEach( fn => fn(payload))
  }

  registerModule(path, module) { // 最终都会转成数组 register(['a', 'c'])
    if (typeof path === 'string') path = [path]

    // modules 是用户直接写的
    this._modules.register(path, module) // 模块的注册， 将用户给的数据放到树中
    // 注册完毕后， 在进行安装

    // 将用户的 module 重新安装
    installModule(this, this.state, path, module.newModule)

    // vuex 内部重新注册的话 会重新生成实例， 虽然重新安装了， 只解决了状态的问题， 但是computed 就丢失了
    resetVM(this, this.state) // 销毁重新来
  }
}

export default Store