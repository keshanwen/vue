import { Vue } from './install'
import { forEach } from './util'


class Store {
  constructor(options) {
    let { state, getters, mutations, actions } = options
    this.getters = {} // 我再取getters属性的时候 把他代理到计算属性上
    const computed = {}
    forEach(getters, (fn, key) => {
      computed[key] = () => {
        return fn(this.state) // 为了保证参数是 state
      }

      // 当我们去 getters 上取值 需要对 computed 取值
      Object.defineProperty(this.getters, key, {
        get: () => this._vm[key] // 具备了缓存功能
      })
    })

    // -------
    this.mutations = {}
    forEach(mutations, (fn, key) => {
      this.mutations[key] = (playload) => fn.call(this, this.state, playload)
    })

    // ------- dispatch 中派发的是动作， 里面可以有异步逻辑，更改状态都要通过mutation, mutation 是同步更改的------
    this.actions = {}
    forEach(actions, (fn, key) => {
      this.actions[key] = (playload) => fn.call(this, this, playload)
    })

    // 这个状态在页面渲染时需要收集对应的渲染 watcher, 这样状态更新才会更新视图
    this._vm = new Vue({
      data: { // $符号开头的数据不会被挂载到实例上， 但是会挂载在当前的 _data上， 减少了一次代理
        $$state: state  // 状态在哪里取值， 就会收集对应的依赖
      },
      computed
    })
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
  dispatch = (type, payload) => { // 根据 cmmit 还是 dispatch 找对应的存储结果
    this.actions[type](payload)
  }
  commit = (type, payload) => {
    this.mutations[type](payload)
  }
}

export default Store