import Dep from "./dep"
import { queueWatcher } from "./scheduler"
import { popTarget, pushTarget } from "./dep"

let id = 0;
class Watcher {
  constructor(vm,exprOrFn,cb, options) {
    this.vm = vm
    this.exprOrFn = exprOrFn
    this.cb = cb
    this.user = !!options.user // 是不是用户watcher
    this.lazy = !!options.lazy
    this.dirty = options.lazy // 如果是计算属性，那么默认值lazy: true dirty: true
    this.options = options
    this.id = id++
    this.depsId = new Set()
    this.deps = []


    if (typeof exprOrFn === 'string') {
      this.getter = function () {
        // 当数据取值时，会进行依赖收集
        // age.n vm['age.n'] => vm['age']['n']
        let path = exprOrFn.split('.')
        let obj = vm
        for (let i = 0; i < path.length; i++) {
          obj = obj[path[i]]
        }
        return obj // getter 方法
      }
    } else {
      this.getter = exprOrFn; // exprOrFn 就是页面渲染逻辑
    }
    // this.get() // 表示上来后就做一次初始化
    // 第一次的 value
    this.value = this.lazy ? undefined : this.get() // 默认初始化 要取值
  }
  addDep(dep) {
    let did = dep.id
    if (!this.depsId.has(did)) {
      this.depsId.add(did)
      this.deps.push(dep) // 做了保存 id 的功能 并且让 watcher 记住 dep
      dep.addSub(this)
    }
  }
  get() {
    // Dep.target = this // Dep.target = watcher
    pushTarget(this)
    const value = this.getter.call(this.vm)
    // this.getter() // 页面的渲染的逻辑 vm.name / vm.age render() 方法会去 vm 上取值 vm._update(vm._render)
    // Dep.target = null // 渲染完毕后 就将标识清空了，只有在渲染的时候才会进行依赖收集
    popTarget()
    return value
  }
  update() {
    // 每次更新数据都会同步调用这个 update 方法，可以将更新的逻辑缓存起来，等会同步更新数据的逻辑执行完毕后，依次调用（去重的逻辑）
    console.log('缓存更新')

    if (this.lazy) {
      this.dirty = true
    } else {
      queueWatcher(this) // 多次调用 update 希望将watcher 缓存起来，等下一会一起更新
    }
    // 可以做异步更新处理
    // this.get()
  }
  run() {
    console.log('真正执行更新')
    //this.get() // render()  取最新的 vm 上的数据
    let newValue = this.get()
    let oldValue = this.value
    this.value = newValue // 为了保证下一次更新时 上一次的最新值是下一次的老值
    if (this.user) {
      this.cb.call(this.vm, newValue, oldValue)
    }
  }
  evaluate() {
    this.dirty = false // 为 fasle 表示已经取过值了
    this.value = this.get() // 用户的 getter 执行
  }
  depend() {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend() // lastName firstName 收集渲染 watcher
    }
  }
}

// watcher 和 dep
// 我们将更新的功能封装了一个 watcher
// 渲染页面前， 会将当前 watcher 放到Dep 类上
// 在 vue 中页面渲染时使用的属性，需要进行依赖收集， 收集对象的渲染watcher
// 取值时， 给每个属性都加了 dep 属性， 用于存储这个 渲染 watcher （同一个watcher 会对应多个dep）
// 每个属性可能对应多个视图 （多个视图肯定是多个 watcher） 一个属性要对应多个watcher
// dep.depend() => 通知dep 存放watcher => Dep.target.addDep()  => 通知watcher 存放dep
// 双向存储

export default Watcher