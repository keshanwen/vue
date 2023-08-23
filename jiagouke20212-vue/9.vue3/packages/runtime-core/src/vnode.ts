// h 最终也会调用这个方法  h('div',{},'a','b')  h(组件)  h(函数)  。。。

import { isArray, isObject, isString, ShapeFlags } from "@vue/shared/src";

export function createVnode(type, props, children = null) { // []
    const shapeFlag =
        isString(type) ? ShapeFlags.ELEMENT :
            isObject(type) ? ShapeFlags.STATEFUL_COMPONENT
                : 0;

    const vnode = {
        __v_isVnode:true,
        type,
        props,
        children,
        el:null, // 对应的真实节点,
        key:props && props.key, // diff 算法需要key
        shapeFlag // 描述虚拟节点是什么类型的
    }

    normalizeChildren(vnode,children)
    // 我要看这个标签 他和他的儿子怎么做
    // diff算法的时候 需要判断两方都有儿子  ， 一方儿子是什么类型的...

    return vnode;
}

function normalizeChildren(vnode,children){
    if(children == null){

    }else if(isArray(children)){
        vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    } else{
        vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }
}

// isElementAndArrayChildren

// h('div',{},['hello','wolred])  此虚拟节点的shapeFlag 是17 表示 他是一个元素 有多个儿子
// shapeFlag = 1 | 16


// 17 是不是元素  17 & 1 大于0是元素
// 17 & 16 如果是大于0 就是数组孩子
