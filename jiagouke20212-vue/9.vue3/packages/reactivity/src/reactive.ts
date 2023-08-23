// 根据不同的参数实现不同的功能 
import { isObject } from "@vue/shared"
import { mutableHandlers, readonlyHandlers, shallowReactiveHandlers, shallowReadonlyHandlers } from "./baseHandlers"

// proxy 是一个es6的api，兼容性差

const reactiveMap = new WeakMap(); // 对象的key 不能用对象, 弱“引用”， map的key是可以用对象的  weakMap中的key只能是对象，如果引用的key 被置为 null weakmap 会自行自动回收
const readonlyMap = new WeakMap();
const shallowReadonlyMap = new WeakMap();
const shallowReactiveMap = new WeakMap();
export function reactive(target:object){ // mutableHandlers
    return createReactiveObject(target,mutableHandlers,reactiveMap);
}
export function shallowReactive(target:object){ // shallowReactiveHandlers
    return createReactiveObject(target,shallowReactiveHandlers,shallowReactiveMap)
}
export function readonly(target:object){ // readonlyHandlers
    return createReactiveObject(target,readonlyHandlers,readonlyMap)
}
export function shallowReadonly(target:object){ // shallowReadonlyHandlers
    return createReactiveObject(target,shallowReadonlyHandlers,shallowReadonlyMap)
}

// 以上四个方法最终用的都是这一个方法，这个方法会根据参数的不同 来进行不同的处理


export function createReactiveObject(target,baseHandlers,proxyMap) {
    // 和 vue2 一样要看一下目标是不是对象
    if(!isObject(target)){
        return target
    }
    // 创建代理对象返回， let obj = {} reactive(obj)   readonly(obj) 做缓存 不要重复代理
    // const proxyMap  = isReadonly ? readonlyMap : reactiveMap
    const existsProxy = proxyMap.get(target);
    if(existsProxy){
        return existsProxy
    }
    const proxy = new Proxy(target,baseHandlers);
    proxyMap.set(target,proxy); // 缓存起来
    return proxy
}