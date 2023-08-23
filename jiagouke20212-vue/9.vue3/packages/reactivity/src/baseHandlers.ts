// 我们期望 实现get和set

import { extend, hasChanged, hasOwn, isArray, isInteger, isObject } from "@vue/shared/src";
import { track, trigger } from "./effect";
import { reactive, readonly } from "./reactive";

const get = createGetter();
const readonlyGet = createGetter(true); // 仅读的get
const shallowGet = createGetter(false, true); // 非仅读但是是浅的
const shallowReadonlyGet = createGetter(true, true); // 仅读是浅的

const set = createSetter();

// 响应式原理的核心就在这个依赖收集
const readonlySet = {
    set(target, key) {
        console.warn(`cannot set on ${key}, readonly!!!`)
    }
}
function createSetter() {
    return function set(target, key, value, receiver) { // value就是设置的值 ，其他一样
        debugger;
        let oldValue = target[key]; // 原对象来缓存老值，没有通过代理对象 不会触发get

        // 如果是新增也要触发更新 
        let hadKey = isArray(target) && isInteger(key) ? key < target.length : hasOwn(target,key);


        // 触发视图更新， 去做处理

        let res = Reflect.set(target, key, value, receiver); // target[key] = value

        if(!hadKey){ // 新增逻辑
            trigger(target, key, value,'add');
        }else if (hasChanged(oldValue, value)) {
            // 需要触发更新逻辑  obj name
            trigger(target, key, value,'set'); // 触发这个对象上的属性 让他更新
        }
        return res;
    }
}


function createGetter(isReadonly = false, shallow = false) {
    // 取值的时候第一个是目标 ， 第二个是属性是谁， 第三个就是代理对象是谁
    return function get(target, key, receiver) { // new Proxy({},{get(){}})
        // 依赖收集  proxy 和 reflect 一般情况下会联合使用

        let res = Reflect.get(target, key, receiver) //  target[key]
        if (!isReadonly) { // 如果对象是一个仅读的属性，那就以意味着这个对象不可能被更改，不可能更新视图，不需要增添依赖收集
            // 不是进仅读的才去收集依赖

            // 如果当前是在effect中取值 要做一个映射关系  obj name -》 [effect,effect]
            //                                         obj age  -》 [effect]
            //  let dep  = new Dep() dep.depend()

            track(target, 'get', key);

        }
        if (shallow) {
            return res; // 如果是浅的说明不需要递归代理了
        }
        if (isObject(res)) { // 如果是对象 就递归代理，但是不是一开始就代理，是在用到这个对象的时候才进行代理的
            return isReadonly ? readonly(res) : reactive(res)
        }
        return res//  target[key];  懒代理，当取值的时候才去进行代理 
    }
}
export const mutableHandlers = { // 核心进行劫持的方法  处理get和set的逻辑
    get,
    set
}
export const shallowReactiveHandlers = {
    get: shallowGet,
    set
}
export const readonlyHandlers = extend({
    get: readonlyGet,
}, readonlySet)
export const shallowReadonlyHandlers = extend({
    get: shallowReadonlyGet,
}, readonlySet)