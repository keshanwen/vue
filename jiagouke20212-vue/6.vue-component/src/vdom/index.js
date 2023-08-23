import Vue from "..";
import { isObject, isReservedTag } from "../utils"


function createComponent(vm,tag,data,children,key,Ctor){
    if(isObject(Ctor)){ // 组件的定义一定是通过Vue.extend 进行包裹的
        Ctor =  vm.$options._base.extend(Ctor)
    }
    data.hook = {
        // 组件的生命周期 
        init(vnode){  // vnode.componentInstance.$el -> 对应组件渲染完毕后的结果
            let child = vnode.componentInstance = new Ctor({}); //我想获取组件的真实dom
            child.$mount(); // 所以组件在走挂载的流程时 vm.$el 为null

            // mount挂载完毕后 会产生一个真实节点，这个节点在 vm.$el上-》 对应的就是组件的真实内容

        },
        prepatch(){

        },
        postpatch(){

        }
        /// 
    }
    // 每个组件 默认的名字内部会给你拼接一下  vue-component-1-my-button
    let componentVnode =  vnode(vm,tag,data,undefined,key,undefined,{Ctor,children,tag});// componentOptions 存放了一个重要的属性交Ctor 构造函数
    return componentVnode
}

export function createElement(vm, tag, data = {}, ...children) { // 返回虚拟节点 _c('',{}....)

    // 如果区分是组件还是元素节点？  
    if(!isReservedTag(tag)){
        let Ctor = vm.$options.components[tag]; // 组件的初始化 就是new 组件的构造函数
        return createComponent(vm, tag, data, children, data.key,Ctor);
    }
  
    return vnode(vm, tag, data, children, data.key, undefined)
}
export function createText(vm, text) { // 返回虚拟节点
    return vnode(vm, undefined, undefined, undefined, undefined, text)
}
// 看两个节点是不是相同节点，就看是不是 tag 和 key都一样
// vue2 就有一个性能问题 ， 递归比对
export function isSameVnode(newVnode,oldVnode){
    return (newVnode.tag === oldVnode.tag) && (newVnode.key == oldVnode.key)
}
function vnode(vm, tag, data, children, key, text,options) {
    return {
        vm,
        tag,
        data,
        children,
        key,
        text,
        componentOptions:options
    }
}
