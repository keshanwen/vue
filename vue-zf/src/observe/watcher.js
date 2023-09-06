import Dep from "./dep"

let id = 0;
class Watcher {
  constructor(vm,fn,cb, options) {
    this.vm = vm
    this.fn = fn
    this.cb = cb
    this.options = options
    this.id = id++
    this.depsId = new Set()
    this.deps = []
    this.getter = fn; // fn 就是页面渲染逻辑
    this.get() // 表示上来后就做一次初始化
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
    this.getter() // 页面的渲染的逻辑 vm.name / vm.age
    Dep.target = null // 渲染完毕后 就将标识清空了，只有在渲染的时候才会进行依赖收集
  }
  update() {
    console.log('update')

    // 可以做异步更新处理
    this.get()
  }
}

export default Watcher