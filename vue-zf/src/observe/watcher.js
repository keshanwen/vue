import Dep from "./dep"
import { queueWatcher } from "./scheduler"

let id = 0;
class Watcher {
  constructor(vm,exprOrFn,cb, options) {
    this.vm = vm
    this.exprOrFn = exprOrFn
    this.cb = cb
    this.user = !!options.user // 是不是用户watcher
    this.lazy = !!options.lazy
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
    Dep.target = this // Dep.target = watcher
    const value = this.getter.call(this.vm)
    // this.getter() // 页面的渲染的逻辑 vm.name / vm.age render() 方法会去 vm 上取值 vm._update(vm._render)
    Dep.target = null // 渲染完毕后 就将标识清空了，只有在渲染的时候才会进行依赖收集
    return value
  }
  update() {
    // 每次更新数据都会同步调用这个 update 方法，可以将更新的逻辑缓存起来，等会同步更新数据的逻辑执行完毕后，依次调用（去重的逻辑）
    console.log('缓存更新')

    queueWatcher(this)
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
}

export default Watcher