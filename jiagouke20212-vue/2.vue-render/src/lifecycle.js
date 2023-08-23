import Watcher from "./observe/watcher";
import { patch } from "./vdom/patch";

export function mountComponent(vm){

    // 初始化流程
    let updateComponent = () =>{
        vm._update(vm._render());  // render()  _c _v _s
    }

    // 每个组件都有一个watcher，我们把这个watcher称之为渲染watcher
    new Watcher(vm,updateComponent,()=>{
        console.log('后续增添更新钩子函数 update')
    },true);

    // updateComponent()
}

export function lifeCycleMixin(Vue){
    Vue.prototype._update = function (vnode) {
        // 采用的是 先序深度遍历 创建节点 （遇到节点就创造节点，递归创建）
        const vm = this;
        vm.$el = patch(vm.$el,vnode)
    }
}