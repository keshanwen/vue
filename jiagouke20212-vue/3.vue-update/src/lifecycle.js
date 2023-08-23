import Watcher from "./observe/watcher";
import { patch } from "./vdom/patch";

export function mountComponent(vm) {

    // 初始化流程
    let updateComponent = () => {
        vm._update(vm._render()); // render()  _c _v _s
    }

    // 每个组件都有一个watcher，我们把这个watcher称之为渲染watcher
    callHook(vm,'beforeCreate')
    new Watcher(vm, updateComponent, () => {
        console.log('后续增添更新钩子函数 update')
        callHook(vm,'created');
    }, true);
    callHook(vm,'mounted');
    // updateComponent()
}
export function lifeCycleMixin(Vue) {
    Vue.prototype._update = function(vnode) {
        // 采用的是 先序深度遍历 创建节点 （遇到节点就创造节点，递归创建）
        const vm = this;
        vm.$el = patch(vm.$el, vnode)
    }
}
export function callHook(vm, hook) {
    let handlers = vm.$options[hook];
    handlers && handlers.forEach(fn => {
        fn.call(vm); // 生命周期的this永远执指向实例
    })
}

// 明天我会发到群里几道面试题：希望大家去思考一下如何去答面试题