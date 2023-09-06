'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const isObject = (val) => typeof val == 'object' && val !== null;
const isArray = Array.isArray;
const extend = Object.assign;
// 判断属性是不是原型属性 
const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);
const hasChanged = (oldValue, value) => oldValue !== value;
const isInteger = (key) => parseInt(key) + '' === key; // '3'  arr.xxx

function effect(fn, options = {}) {
    let effect = createReactiveEffect(fn, options); // 把fn包装成一个响应式的函数
    if (!options.lazy) {
        effect();
    }
    return effect;
}
let uid = 0;
let activeEffect; // 此模块内唯一的一个变量
function createReactiveEffect(fn, options) {
    const effect = function () {
        // 我需要将effect暴露到外层
        activeEffect = effect; // Dep.target = watcher
        fn(); // 当我执行用户传入的函数时 会执行get方法
        activeEffect = null;
    };
    effect.id = uid++; // 每个effect都有一个唯一的标识 （watcher）
    effect._isEffect = true; // 用于标识这个函数是一个effect函数
    effect.raw = fn; // 把用户传入的函数保存到当前的effect上
    effect.deps = []; // 后续用来存放此effect对于哪些属性
    effect.options = options;
    return effect;
}
// obj   name   => 
/**
weakMap = {
    object:Map({
        name:new Set(effect,effect)
    })
}
 */
const targetMap = new WeakMap(); // weakMap 的key只能是对象
function track(target, type, key) {
    if (!activeEffect) { // 说明取值操作是在effect之外操作的 
        return;
    } // 直接跳过依赖收集
    let depsMap = targetMap.get(target); // 先尝试看一下这个对象中是否存过属性
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map)); // {obj:map({key:set(effect,effect)})}
    }
    let dep = depsMap.get(key);
    if (!dep) {
        depsMap.set(key, (dep = new Set));
    }
    if (!dep.has(activeEffect)) { // 同一个属性 不会添加重复的effect
        dep.add(activeEffect);
    }
    // 制作一个依赖收集的关联列表
}
function trigger(target, key, value, type) {
    const depsMap = targetMap.get(target); // 先看一下有没有收集过依赖
    if (!depsMap)
        return; // 如果没有收集过 直接跳过
    // 为了实现批处理 我们把所有的effect放到一个set中 ，做一下去重 
    const effectsQueue = new Set();
    const add = (effectsToAdd) => {
        if (effectsToAdd)
            effectsToAdd.forEach(effect => effectsQueue.add(effect));
    };
    // 如果修改的是数组 并且改的是长度 要做一些处理  
    if (isArray(target) && key == 'length') {
        // value; // 是数组长度   depsMap 存放的key 可能是索引 如果索引大于数组长度 修奥触发更新
        depsMap.forEach((dep, depKey) => {
            // [1,2,3]  arr[2]  arr.length = 1  3=> undefined
            // [1,2,3]  arr[2]  arr.length = 100  3=> 3
            if (depKey == 'length' || value < depKey) {
                add(dep);
            }
        });
    }
    else {
        if (type == 'add') { // 新增逻辑 需要触发更新 触发length的更新 针对的是数组 
            if (isArray(target) && isInteger(key)) {
                add(depsMap.get('length'));
            }
            else { // 对象新增逻辑, 对象新增逻辑也要触发对应的更新
                add(depsMap.get(key));
            }
        }
        else {
            const effects = depsMap.get(key); // 找到此属性对应的effect列表 ，直接执行即可
            add(effects);
        }
    }
    effectsQueue.forEach((effect) => {
        if (effect.options.scheduler) {
            effect.options.scheduler(effect);
        }
        else {
            effect();
        }
    });
}

// 我们期望 实现get和set
const get = createGetter();
const readonlyGet = createGetter(true); // 仅读的get
const shallowGet = createGetter(false, true); // 非仅读但是是浅的
const shallowReadonlyGet = createGetter(true, true); // 仅读是浅的
const set = createSetter();
// 响应式原理的核心就在这个依赖收集
const readonlySet = {
    set(target, key) {
        console.warn(`cannot set on ${key}, readonly!!!`);
    }
};
function createSetter() {
    return function set(target, key, value, receiver) {
        debugger;
        let oldValue = target[key]; // 原对象来缓存老值，没有通过代理对象 不会触发get
        // 如果是新增也要触发更新 
        let hadKey = isArray(target) && isInteger(key) ? key < target.length : hasOwn(target, key);
        // 触发视图更新， 去做处理
        let res = Reflect.set(target, key, value, receiver); // target[key] = value
        if (!hadKey) { // 新增逻辑
            trigger(target, key, value, 'add');
        }
        else if (hasChanged(oldValue, value)) {
            // 需要触发更新逻辑  obj name
            trigger(target, key, value, 'set'); // 触发这个对象上的属性 让他更新
        }
        return res;
    };
}
function createGetter(isReadonly = false, shallow = false) {
    // 取值的时候第一个是目标 ， 第二个是属性是谁， 第三个就是代理对象是谁
    return function get(target, key, receiver) {
        // 依赖收集  proxy 和 reflect 一般情况下会联合使用
        let res = Reflect.get(target, key, receiver); //  target[key]
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
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res; //  target[key];  懒代理，当取值的时候才去进行代理 
    };
}
const mutableHandlers = {
    get,
    set
};
const shallowReactiveHandlers = {
    get: shallowGet,
    set
};
const readonlyHandlers = extend({
    get: readonlyGet,
}, readonlySet);
const shallowReadonlyHandlers = extend({
    get: shallowReadonlyGet,
}, readonlySet);

// 根据不同的参数实现不同的功能 
// proxy 是一个es6的api，兼容性差
const reactiveMap = new WeakMap(); // 对象的key 不能用对象, 弱“引用”， map的key是可以用对象的  weakMap中的key只能是对象，如果引用的key 被置为 null weakmap 会自行自动回收
const readonlyMap = new WeakMap();
const shallowReadonlyMap = new WeakMap();
const shallowReactiveMap = new WeakMap();
function reactive(target) {
    return createReactiveObject(target, mutableHandlers, reactiveMap);
}
function shallowReactive(target) {
    return createReactiveObject(target, shallowReactiveHandlers, shallowReactiveMap);
}
function readonly(target) {
    return createReactiveObject(target, readonlyHandlers, readonlyMap);
}
function shallowReadonly(target) {
    return createReactiveObject(target, shallowReadonlyHandlers, shallowReadonlyMap);
}
// 以上四个方法最终用的都是这一个方法，这个方法会根据参数的不同 来进行不同的处理
function createReactiveObject(target, baseHandlers, proxyMap) {
    // 和 vue2 一样要看一下目标是不是对象
    if (!isObject(target)) {
        return target;
    }
    // 创建代理对象返回， let obj = {} reactive(obj)   readonly(obj) 做缓存 不要重复代理
    // const proxyMap  = isReadonly ? readonlyMap : reactiveMap
    const existsProxy = proxyMap.get(target);
    if (existsProxy) {
        return existsProxy;
    }
    const proxy = new Proxy(target, baseHandlers);
    proxyMap.set(target, proxy); // 缓存起来
    return proxy;
}

function ref(value) {
    return createRef(value);
}
const convert = val => isObject(val) ? reactive(val) : val;
class RefImpl {
    rawValue;
    isShallow;
    _value;
    constructor(rawValue, isShallow) {
        this.rawValue = rawValue;
        this.isShallow = isShallow;
        this._value = isShallow ? rawValue : convert(rawValue); // this._value 就是一个私有属性 
    }
    // 这两个方法 会被转化成defineProperty
    get value() {
        track(this, 'get', 'value');
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(newValue, this.rawValue)) {
            this.rawValue = newValue; // 说明属性变化 需要更新
            this._value = this.isShallow ? newValue : convert(newValue);
            trigger(this, 'value', newValue, 'set');
        }
    }
}
function createRef(value, isShallow = false) {
    return new RefImpl(value, isShallow);
}
class ObjectRefImpl {
    target;
    key;
    constructor(target, key) {
        this.target = target;
        this.key = key;
    }
    get value() {
        return this.target[this.key];
    }
    set value(newValue) {
        this.target[this.key] = newValue;
    }
}
// promisefy
// promisifyAll
function toRefs(object) {
    // 对象的浅拷贝 
    const ret = isArray(object) ? new Array(object.length) : {};
    for (let key in object) {
        ret[key] = toRef(object, key);
    }
    return ret;
}
function toRef(target, key) {
    return new ObjectRefImpl(target, key);
}
// 模板渲染的时候 会去判断是不是ref 如果是ref  就直接.value

exports.effect = effect;
exports.reactive = reactive;
exports.readonly = readonly;
exports.ref = ref;
exports.shallowReactive = shallowReactive;
exports.shallowReadonly = shallowReadonly;
exports.toRef = toRef;
exports.toRefs = toRefs;
//# sourceMappingURL=reactivity.cjs.js.map
