'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const isObject = (val) => typeof val == 'object' && val !== null;
const isFunction = (val) => typeof val == 'function';
const isString = (val) => typeof val == 'string';
const isArray = Array.isArray;
const extend = Object.assign;
// 判断属性是不是原型属性 
const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);
const hasChanged = (oldValue, value) => oldValue !== value;
const isInteger = (key) => parseInt(key) + '' === key; // '3'  arr.xxx
// +=   LET XXX = A+B
// |=   LET XXX = A | B

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
const readonlyHandlers = extend({
    get: readonlyGet,
}, readonlySet);
extend({
    get: shallowReadonlyGet,
}, readonlySet);

// 根据不同的参数实现不同的功能 
// proxy 是一个es6的api，兼容性差
const reactiveMap = new WeakMap(); // 对象的key 不能用对象, 弱“引用”， map的key是可以用对象的  weakMap中的key只能是对象，如果引用的key 被置为 null weakmap 会自行自动回收
const readonlyMap = new WeakMap();
function reactive(target) {
    return createReactiveObject(target, mutableHandlers, reactiveMap);
}
function readonly(target) {
    return createReactiveObject(target, readonlyHandlers, readonlyMap);
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
// 模板渲染的时候 会去判断是不是ref 如果是ref  就直接.value

// h 最终也会调用这个方法  h('div',{},'a','b')  h(组件)  h(函数)  。。。
function createVnode(type, props, children = null) {
    const shapeFlag = isString(type) ? 1 /* ELEMENT */ :
        isObject(type) ? 4 /* STATEFUL_COMPONENT */
            : 0;
    const vnode = {
        __v_isVnode: true,
        type,
        props,
        children,
        el: null,
        key: props && props.key,
        shapeFlag // 描述虚拟节点是什么类型的
    };
    normalizeChildren(vnode, children);
    // 我要看这个标签 他和他的儿子怎么做
    // diff算法的时候 需要判断两方都有儿子  ， 一方儿子是什么类型的...
    return vnode;
}
function normalizeChildren(vnode, children) {
    if (children == null) ;
    else if (isArray(children)) {
        vnode.shapeFlag |= 16 /* ARRAY_CHILDREN */;
    }
    else {
        vnode.shapeFlag |= 8 /* TEXT_CHILDREN */;
    }
}
// isElementAndArrayChildren
// h('div',{},['hello','wolred])  此虚拟节点的shapeFlag 是17 表示 他是一个元素 有多个儿子
// shapeFlag = 1 | 16
// 17 是不是元素  17 & 1 大于0是元素
// 17 & 16 如果是大于0 就是数组孩子

function createAppAPI(render) {
    return (rootComponent, rootProps) => {
        let app = {
            _component: rootComponent,
            _rootProps: rootProps,
            _container: null,
            use() {
            },
            mixin() {
            },
            component() {
            },
            mount(container) {
                // 创建一个虚拟节点
                const vnode = createVnode(rootComponent, rootProps); // h方法
                // 将虚拟节点 转换成真实节点，插入到container中
                render(vnode, container);
                app._container = container;
            }
        };
        return app;
    };
}

function createComponentInstance(vnode) {
    const instance = {
        vnode,
        data: {},
        attrs: {},
        props: { xxx: 1 },
        slots: {},
        render: null,
        setupState: {},
        subTree: null,
        isMounted: false,
        bc: null,
        m: null,
        ctx: {},
        proxy: {},
        update: null
    };
    // vue2 中取 props,data？ 在哪里取出来的 this._data this._props
    instance.ctx = { _: instance };
    // new Proxy
    return instance;
}
const isStatefulComponent = (vnode) => {
    return vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */;
};
// vue2 无状态组件 就是没有data，只有属性和外界传过来的数据 
function createContext(instance) {
    return {
        attrs: instance.attrs,
        slots: instance.slots,
        emit: () => { },
        expose: () => { } // 如果用户使用了ref属性 放到了组件上，他默认拿到的是组件的实例，但是如果定义了expose，那么就拿到的是expose，不在是组件实例
    };
}
function finishComponentSetup(instance) {
    const Component = instance.vnode.type;
    if (!instance.render) {
        if (!Component.render && Component.template) ;
        instance.render = Component.render; // 组件的render挂载到实力上
        // render函数 就是用户写的render， 数据可以在 instance.proxy上取
    }
}
function handleSetupResult(instance, setupResult) {
    if (isFunction(setupResult)) {
        instance.render = setupResult;
    }
    else if (isObject(setupResult)) {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.vnode.type; // 用户定义的对象，组件本身
    instance.proxy = new Proxy(instance.ctx, {
        get({ _: instance }, key) {
            const { setupState, props, data } = instance;
            if (hasOwn(setupState, key)) {
                return setupState[key];
            }
            else if (hasOwn(data, key)) {
                return data[key];
            }
            else if (hasOwn(props, key)) {
                return props[key];
            }
        },
        set({ _: instance }, key, value) {
            const { setupState, props, data } = instance;
            if (hasOwn(setupState, key)) {
                setupState[key] = value;
            }
            else if (hasOwn(data, key)) {
                data[key] = value;
            }
            else if (hasOwn(props, key)) {
                props[key] = value;
            }
            return true;
        }
    });
    let { setup } = Component;
    if (setup) {
        let ctx = createContext(instance);
        const setupResult = setup(instance.props, ctx);
        handleSetupResult(instance, setupResult);
    }
    else {
        finishComponentSetup(instance);
    }
}
function setupComponent(instance) {
    instance.vnode;
    // initProps()
    // initSlot()
    const isStateful = isStatefulComponent(instance.vnode);
    isStateful ? setupStatefulComponent(instance) : undefined; // 取setup的返回值
}

function createRenderer(rendererOptions) {
    const { insert: hostInsert, remove: hostRemove, patchProp: hostPatchProp, createElement: hostCreateElement, createText: hostCreateText, setText: hostSetText, setElementText: hostSetElementText, } = rendererOptions;
    const mountChildren = (children, container) => {
        for (let i = 0; i < children.length; i++) {
            patch(null, children[i], container);
        }
    };
    const mountElement = (n2, container) => {
        // 递归渲染虚拟节点
        const { props, type, children, shapeFlag } = n2;
        let el = n2.el = hostCreateElement(type);
        if (props) {
            for (let key in props) {
                hostPatchProp(el, key, null, props[key]);
            }
        }
        if (shapeFlag & 8 /* TEXT_CHILDREN */) {
            hostSetElementText(el, children);
        }
        else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            mountChildren(children, el);
        }
        hostInsert(el, container);
    };
    const processElement = (n1, n2, container) => {
        if (n1 == null) {
            // 元素的初始化
            mountElement(n2, container);
        }
    };
    const patch = (n1, n2, container) => {
        // 渲染逻辑 diff算法
        const { shapeFlag } = n2;
        if (shapeFlag & 1 /* ELEMENT */) {
            // n2 是什么类型的 如果是一个元素的虚拟节点 -》 创建一个元素的真实节点 插入到容器中
            processElement(n1, n2, container);
        }
        else if (shapeFlag & 4 /* STATEFUL_COMPONENT */) {
            // 初始化的时候 n2 是一个组件的虚拟节点
            processComponent(n1, n2, container);
        }
    };
    // 和 vue2 组件渲染一致 -》 组件的虚拟节点-》 创造组件实例-》 调用组件的render方法 -》 拿到组件的返回的虚拟节点 -》 创建真是节点 
    // vue2 组件每个组件都有一个watcher， 如果数据更新 重新执行watcher， 依赖收集
    const setupRenderEffect = (instance, container) => {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                // 初渲染逻辑, 会进行依赖收集 用到的属性 会将组件的effect收集起来
                let subTree = instance.subTree = instance.render.call(instance.proxy, instance.proxy);
                patch(null, subTree, container);
                instance.isMounted = true;
            }
            else {
                // 数据变化了 会执行此逻辑 diff算法
                instance.subTree;
                instance.render.call(instance.proxy, instance.proxy);
                // patch(prevSubTree, nextSubTree, container);
                // 下周四 周六 手写Vuex4.0
                // 下周四 周六 手写Vue-router4.0
                // 
            }
        }, {
            scheduler(effect) {
                // queueWatcher
                console.log(effect, '--------------');
            }
        });
    };
    const mountComponent = (n2, container) => {
        // 1.组件如何挂载？  new vnode.componentOptions.Ctor => vnode.componentInstance
        // 创建一个组件的实例
        const instance = createComponentInstance(n2); // 组件创建流程
        setupComponent(instance); // 将自己的数据 填充到instance上
        // instance.render(instance.proxy ) => h()  => 虚拟节点 => 真实节点
        setupRenderEffect(instance, container); // 添加渲染effect
    };
    const processComponent = (n1, n2, container) => {
        if (n1 == null) {
            // 初始化
            mountComponent(n2, container);
        }
    };
    const render = (vnode, container) => {
        // 根据虚拟节点 创建真实节点 插入到容器中
        patch(null, vnode, container);
    };
    return {
        createApp: createAppAPI(render)
    };
}

function h(type, propsOrChildren, children) {
    //  2 3 多个
    let l = arguments.length;
    if (l == 2) {
        // 1.类型 + 属性 
        if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
            return createVnode(type, propsOrChildren);
        }
        else {
            // 第二个参数是一个数组 
            return createVnode(type, null, propsOrChildren);
        }
    }
    else {
        if (l == 3) {
            return createVnode(type, propsOrChildren, children);
        }
        else if (l > 3) {
            return createVnode(type, propsOrChildren, Array.from(arguments).slice(2));
        }
    }
}

const nodeOps = {
    createElement(tagName) {
        return document.createElement(tagName);
    },
    remove(child) {
        const parent = child.parentNode;
        if (parent) {
            parent.removeChild(child);
        }
    },
    querySelector(selector) {
        return document.querySelector(selector);
    },
    insert(child, parent, anchor = null) {
        parent.insertBefore(child, anchor);
    },
    setElementText(el, text) {
        el.textContent = text; // innerHTML会有风险
    },
    createText(text) {
        return document.createTextNode(text);
    },
    setText(node, text) {
        node.nodeValue = text;
    }
};

function patchAttr(el, key, nextVal) {
    if (nextVal == null) {
        el.removeAttribute(key);
    }
    else {
        el.setAttribute(key, nextVal);
    }
}

function patchClass(el, nextVal) {
    if (nextVal == null) {
        nextVal = '';
    }
    el.className = nextVal;
}

function patchEvent(el, key, nextVal) {
    const invokers = el._vei || (el._vei = {}); // 用来缓存绑定的事件
    const exists = invokers[key];
    if (exists && nextVal) { // el.addEventListener('click')
        exists.value = nextVal;
    }
    else {
        const eventName = key.slice(2).toLowerCase();
        if (nextVal) {
            const fn = invokers[key] = createInvoker(nextVal);
            el.addEventListener(eventName, fn);
        }
        else {
            el.removeEventListener(eventName, exists); //移除函数
        }
    }
    // let fn = () =》{ fn.xxx()}
    // fn.xxx = preFn
    // el.addEventListenr(fn) 
    // fn.xxx = nextVal
}
function createInvoker(fn) {
    const invoker = (e) => { invoker.value(e); };
    invoker.value = fn;
    return invoker;
}

function patchStyle(el, prevVal, nextVal) {
    const style = el.style; // 元素的样式 
    if (nextVal == null) {
        el.removeAttribute('style');
    }
    else {
        if (prevVal) { // 之前有现在没有了 需要移除 
            for (let key in prevVal) {
                if (nextVal[key] == null) {
                    style[key] = ''; // 样式给空就清除掉了
                }
            }
        }
        for (let key in nextVal) {
            style[key] = nextVal[key];
        }
    }
}

const patchProp = (el, key, prevVal, nextVal) => {
    switch (key) {
        case 'class': // dom操作 el.className
            patchClass(el, nextVal);
            break;
        case 'style': // el.style.background
            patchStyle(el, prevVal, nextVal); // 样式要比对前囧
            break;
        default:
            if (/^on[a-z]/.test(key)) { // el.addEventListener
                patchEvent(el, key, nextVal);
            }
            else { // el.setAttribute
                patchAttr(el, key, nextVal);
            }
    }
};

// import { createRenderer } from "@vue/runtime-core";
// runtimeDOM 主要的目的是提供 操作的api
// 创建渲染器 createRenderer
const rendererOptions = extend({ patchProp }, nodeOps); // 渲染时需要用到这里的所有dom方法
// 操作dom 无非就是dom的增删改查 。属性、类名、事件、。。。
function createApp(rootComponent, rootProps = null) {
    const app = createRenderer(rendererOptions).createApp(rootComponent, rootProps);
    let { mount } = app;
    app.mount = function (container) {
        container = nodeOps.querySelector(container);
        container.innerHTML = ''; // 移除v-clock
        const proxy = mount(container);
        return proxy;
    };
    return app;
}

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.h = h;
exports.reactive = reactive;
exports.ref = ref;
//# sourceMappingURL=runtime-dom.cjs.js.map
