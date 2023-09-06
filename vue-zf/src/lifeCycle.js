import { patch } from "./vdom/patch"
import Watcher from "./observe/watcher"


export function mountComponent(vm) {
  let updateComponent = () => {
    vm._update(vm._render())
  }

  // 每个组件都有一个 watcher, 我们把这个 watcher 称之为渲染 watcher
  new Watcher(vm, updateComponent, () => {
    console.log('后续增加更新钩子函数 update')
  }, true)

  // updateComponent()
}

export function lifeCycleMixin(Vue) {
  Vue.prototype._update = function (vnode) {
    // 采用的是 先深度遍历 创建节点（遇到节点就创造节点，递归创建）
    const vm = this
    vm.$el = patch(vm.$el, vnode)
  }
}