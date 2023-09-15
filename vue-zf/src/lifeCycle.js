import { patch } from "./vdom/patch"
import Watcher from "./observe/watcher"
import { nextTick } from "./utils"


export function mountComponent(vm) {
  let updateComponent = () => {
    vm._update(vm._render())
  }
  // 观察者模式： 属性是“被观察者” 刷新页面: “观察者”
  callHook(vm, 'beforeMount')
  // 每个组件都有一个 watcher, 我们把这个 watcher 称之为渲染 watcher
  new Watcher(vm, updateComponent, () => {
    console.log('后续增加更新钩子函数 update')
  }, true)
  callHook(vm, 'mounted')
  // updateComponent()
}

export function lifeCycleMixin(Vue) {
  Vue.prototype._update = function (vnode) {
    // 既有初始化，又有更新
    // 采用的是 先深度遍历 创建节点（遇到节点就创造节点，递归创建）
    const vm = this
    const prevVnode = vm._vnode // 表示将当前的虚拟节点保存起来

    if (!prevVnode) { // 初次渲染
      vm.$el = patch(vm.$el, vnode)
    } else {
      vm.$el = patch(prevVnode, vnode)
    }
    vm._vnode = vnode
  }

  Vue.prototype.$nextTick = nextTick
}

export function callHook(vm,hook){
    let handlers = vm.$options[hook];
    if(handlers){
        for(let i =0; i < handlers.length;i++){
            handlers[i].call(vm)
        }
    }
}