let id = 0
/*
  多对多的关系
  dep.subs = [watcher]
  watcher.deps = [dep]
*/

class Dep {
  constructor() { // 要把 watcher 放到 dep 中
    this.subs = []
    this.id = id++
  }
  depend() {
    // 要给watcher 也加一个标识 防止重复
    // this.subs.push(Dep.target)
    // 让 dep 记住这个 watcher ,watcher 还要记住 dep 相互的关系
    Dep.target.addDep(this) // 在 watcher 中在条用 dep 的 addSub 方法
  }
  addSub(watcher) {
    this.subs.push(watcher)
  }
  notify() {
    this.subs.forEach( watcher => watcher.update())
  }
}

Dep.target = null // 这里我用了一个全局的变量 window.target 静态属性

export default Dep;
