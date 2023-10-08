var VueRuntimeDOM = (function (exports) {
    'use strict';

    const isObject = (value) => typeof value == 'object' && value !== null;
    const extend = Object.assign;
    const isArray = Array.isArray;
    const isFunction = (value) => typeof value == 'function';
    const isString = (value) => typeof value === 'string';
    const isIntegerKey = (key) => parseInt(key) + '' === key;
    let hasOwnpRroperty = Object.prototype.hasOwnProperty;
    const hasOwn = (target, key) => hasOwnpRroperty.call(target, key);
    const hasChanged = (oldValue, value) => oldValue !== value;

    const nodeOps = {
        // createElement, 不同的平台创建元素方式不同
        // 元素
        createElement: tagName => document.createElement(tagName),
        remove: child => {
            const parent = child.parentNode;
            if (parent) {
                parent.removeChild(child);
            }
        },
        insert: (child, parent, anchor = null) => {
            parent.insertBefore(child, anchor); // 如果参照物为空 则相当于appendChild
        },
        querySelector: selector => document.querySelector(selector),
        setElementText: (el, text) => el.textContent = text,
        // 文本操作 创建文本 
        createText: text => document.createTextNode(text),
        setText: (node, text) => node.nodeValue = text
    };

    const patchAttr = (el, key, value) => {
        if (value == null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, value);
        }
    };

    const patchClass = (el, value) => {
        if (value == null) {
            value = '';
        }
        el.className = value;
    };

    // 1.给元素缓存一个绑定事件的列表
    // 2.如果缓存中没有缓存过的，而且value有值 需要绑定方法，并且缓存起来
    // 3.以前绑定过需要删除掉，删除缓存
    // 4.如果前后都有，直接改变invoker中value属性指向最新的事件 即可
    const patchEvent = (el, key, value) => {
        // 对函数的缓存
        const invokers = el._vei || (el._vei = {});
        const exists = invokers[key]; // 如果不存在
        if (value && exists) { // 需要绑定事件 而且还存在的情况下
            exists.value = value;
        }
        else {
            const eventName = key.slice(2).toLowerCase();
            if (value) { // 要绑定事件 以前没有绑定过
                let invoker = invokers[key] = createInvoker(value);
                el.addEventListener(eventName, invoker);
            }
            else { // 以前绑定了 当时没有value
                el.removeEventListener(eventName, exists);
                invokers[key] = undefined;
            }
        }
    };
    function createInvoker(value) {
        const invoker = (e) => { invoker.value(e); };
        invoker.value = value; // 为了能随时更改value属性
        return invoker;
    }
    // 一个元素 绑定事件  addEventListener(fn) addEventListener(fn1) 
    // value = fn
    // div @click="fn"  ()=> value()
    // div

    const patchStyle = (el, prev, next) => {
        const style = el.style; //获取样式 
        if (next == null) {
            el.removeAttribute('style'); // {style:{}}  {}
        }
        else {
            // 老的里新的有没有 
            if (prev) { // {style:{color}} => {style:{background}}
                for (let key in prev) {
                    if (next[key] == null) { // 老的里有 新的里没有 需要删除
                        style[key] = '';
                    }
                }
            }
            // 新的里面需要赋值到style上
            for (let key in next) { // {style:{color}} => {style:{background}}
                style[key] = next[key];
            }
        }
    };

    // 这个里面针对的是属性操作，一系列的属性操作
    const patchProp = (el, key, prevValue, nextValue) => {
        switch (key) {
            case 'class':
                patchClass(el, nextValue); // 比对属性
                break;
            case 'style': // {style:{color:'red'}}  {style:{background:'red'}}
                patchStyle(el, prevValue, nextValue);
                break;
            default:
                // 如果不是事件 才是属性
                if (/^on[^a-z]/.test(key)) {
                    patchEvent(el, key, nextValue); // 事件就是添加和删除 修改
                }
                else {
                    patchAttr(el, key, nextValue);
                }
                break;
        }
    };

    function effect(fn, options = {}) {
        // 我需要让这个effect变成响应的effect，可以做到数据变化重新执行 
        const effect = createReactiveEffect(fn, options);
        if (!options.lazy) { // 默认的effect会先执行
            effect(); // 响应式的effect默认会先执行一次
        }
        return effect;
    }
    let uid = 0;
    let activeEffect; // 存储当前的effect
    const effectStack = [];
    function createReactiveEffect(fn, options) {
        const effect = function reactiveEffect() {
            if (!effectStack.includes(effect)) { // 保证effect没有加入到effectStack中
                try {
                    effectStack.push(effect);
                    activeEffect = effect;
                    return fn(); // 函数执行时会取值  会执行get方法
                }
                finally {
                    effectStack.pop();
                    activeEffect = effectStack[effectStack.length - 1];
                }
            }
        };
        effect.id = uid++; // 制作一个effect标识 用于区分effect
        effect._isEffect = true; // 用于标识这个是响应式effect
        effect.raw = fn; // 保留effect对应的原函数
        effect.options = options; // 在effect上保存用户的属性
        return effect;
    }
    // 让，某个对象中的属性 收集当前他对应的effect函数
    const targetMap = new WeakMap();
    function track(target, type, key) {
        //  activeEffect; // 当前正在运行的effect
        if (activeEffect === undefined) { // 此属性不用收集依赖，因为没在effect中使用
            return;
        }
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map));
        }
        let dep = depsMap.get(key);
        if (!dep) {
            depsMap.set(key, (dep = new Set));
        }
        if (!dep.has(activeEffect)) {
            dep.add(activeEffect);
        }
    }
    // 找属性对应的effect 让其执行 （数组、对象）
    function trigger(target, type, key, newValue, oldValue) {
        // 如果这个属性没有 收集过effect，那不需要做任何操作
        const depsMap = targetMap.get(target);
        if (!depsMap)
            return;
        const effects = new Set(); // 这里对effect去重了
        const add = (effectsToAdd) => {
            if (effectsToAdd) {
                effectsToAdd.forEach(effect => effects.add(effect));
            }
        };
        // 我要将所有的 要执行的effect 全部存到一个新的集合中，最终一起执行
        // 1. 看修改的是不是数组的长度 因为改长度影响比较大
        if (key === 'length' && isArray(target)) {
            // 如果对应的长度 有依赖收集需要更新
            depsMap.forEach((dep, key) => {
                if (key === 'length' || key > newValue) { // 如果更改的长度 小于收集的索引，那么这个索引也需要触发effect重新执行
                    add(dep);
                }
            });
        }
        else {
            // 可能是对象
            if (key !== undefined) { // 这里肯定是修改， 不能是新增
                add(depsMap.get(key)); // 如果是新增
            }
            // 如果修改数组中的 某一个索引 怎么办？
            switch (type) { // 如果添加了一个索引就触发长度的更新
                case 0 /* ADD */:
                    if (isArray(target) && isIntegerKey(key)) {
                        add(depsMap.get('length'));
                    }
            }
        }
        effects.forEach((effect) => {
            if (effect.options.scheduler) {
                effect.options.scheduler(effect);
            }
            else {
                effect();
            }
        });
    }
    // weakMap {name:'zf',age:12}  (map) =>{name => set(effect),age => set(effect)}
    // {name:'zf',age:12} => name => [effect effect]
    // 函数调用是一个栈型结构
    // effect(()=>{ // effect1   [effect1]
    //     state.name -> effect1
    //     effect(()=>{ // effect2
    //         state.age -> effect2
    //     })
    //     state.address -> effect1
    // })

    // 实现 new Proxy(target, handler)
    const get = createGetter();
    const shallowGet = createGetter(false, true);
    const readonlyGet = createGetter(true);
    const showllowReadonlyGet = createGetter(true, true);
    const set = createSetter();
    const shallowSet = createSetter(true);
    const mutableHandlers = {
        get,
        set
    };
    const shallowReactiveHandlers = {
        get: shallowGet,
        set: shallowSet
    };
    let readonlyObj = {
        set: (target, key) => {
            console.warn(`set on key ${key} falied`);
        }
    };
    const readonlyHandlers = extend({
        get: readonlyGet,
    }, readonlyObj);
    const shallowReadonlyHandlers = extend({
        get: showllowReadonlyGet,
    }, readonlyObj);
    // 是不是仅读的，仅读的属性set时会报异常
    // 是不是深度的 
    function createGetter(isReadonly = false, shallow = false) {
        return function get(target, key, receiver) {
            // proxy + reflect
            // 后续Object上的方法 会被迁移到Reflect Reflect.getProptypeof()
            // 以前target[key] = value 方式设置值可能会失败 ， 并不会报异常 ，也没有返回值标识
            // Reflect 方法具备返回值
            // reflect 使用可以不使用 proxy es6语法
            const res = Reflect.get(target, key, receiver); // target[key];
            if (!isReadonly) {
                // 收集依赖，等会数据变化后更新对应的视图
                track(target, 0 /* GET */, key);
            }
            if (shallow) {
                return res;
            }
            if (isObject(res)) { // vue2 是一上来就递归，vue3 是当取值时会进行代理 。 vue3的代理模式是懒代理
                return isReadonly ? readonly(res) : reactive(res);
            }
            return res;
        };
    }
    function createSetter(shallow = false) {
        return function set(target, key, value, receiver) {
            const oldValue = target[key]; // 获取老的值
            let hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
            const result = Reflect.set(target, key, value, receiver); // target[key] = value
            if (!hadKey) {
                // 新增 
                trigger(target, 0 /* ADD */, key, value);
            }
            else if (hasChanged(oldValue, value)) {
                // 修改 
                trigger(target, 1 /* SET */, key, value);
            }
            // 我们要区分是新增的 还是修改的  vue2 里无法监控更改索引，无法监控数组的长度变化  -》 hack的方法 需要特殊处理
            // 当数据更新时 通知对应属性的effect重新执行
            return result;
        };
    }

    function reactive(target) {
        return createReactiveObject(target, false, mutableHandlers);
    }
    function shallowReactive(target) {
        return createReactiveObject(target, false, shallowReactiveHandlers);
    }
    function readonly(target) {
        return createReactiveObject(target, true, readonlyHandlers);
    }
    function shallowReadonly(target) {
        return createReactiveObject(target, true, shallowReadonlyHandlers);
    }
    // 是不是仅读 是不是深度， 柯里化  new Proxy() 最核心的需要拦截 数据的读取和数据的修改  get set
    const reactiveMap = new WeakMap(); // 会自动垃圾回收，不会造成内存泄漏， 存储的key只能是对象
    const readonlyMap = new WeakMap();
    function createReactiveObject(target, isReadonly, baseHandlers) {
        // 如果目标不是对象 没法拦截了，reactive这个api只能拦截对象类型
        if (!isObject(target)) {
            return target;
        }
        // 如果某个对象已经被代理过了 就不要再次代理了  可能一个对象 被代理是深度 又被仅读代理了
        const proxyMap = isReadonly ? readonlyMap : reactiveMap;
        const existProxy = proxyMap.get(target);
        if (existProxy) {
            return existProxy; // 如果已经被代理了 直接返回即可
        }
        const proxy = new Proxy(target, baseHandlers);
        proxyMap.set(target, proxy); // 将要代理的对象 和对应代理结果缓存起来
        return proxy;
    }

    function ref(value) {
        // 将普通类型 变成一个对象 , 可以是对象 但是一般情况下是对象直接用reactive更合理
        return createRef(value);
    }
    // ref 和 reactive的区别 reactive内部采用proxy  ref中内部使用的是defineProperty
    function shallowRef(value) {
        return createRef(value, true);
    }
    // 后续 看vue的源码 基本上都是高阶函数 做了类似柯里化的功能
    const convert = (val) => isObject(val) ? reactive(val) : val;
    // beta 版本 之前的版本ref 就是个对象 ，由于对象不方便扩展 改成了类
    class RefImpl {
        constructor(rawValue, shallow) {
            this.rawValue = rawValue;
            this.shallow = shallow;
            this.__v_isRef = true; // 产生的实例会被添加 __v_isRef 表示是一个ref属性
            this._value = shallow ? rawValue : convert(rawValue); // 如果是深度 需要把里面的都变成响应式的
        }
        // 类的属性访问器
        get value() {
            track(this, 0 /* GET */, 'value');
            return this._value;
        }
        set value(newValue) {
            if (hasChanged(newValue, this.rawValue)) { // 判断老值和新值是否有变化
                this.rawValue = newValue; // 新值会作为老值
                this._value = this.shallow ? newValue : convert(newValue);
                trigger(this, 1 /* SET */, 'value', newValue);
            }
        }
    }
    function createRef(rawValue, shallow = false) {
        return new RefImpl(rawValue, shallow);
    }
    class ObjectRefImpl {
        constructor(target, key) {
            this.target = target;
            this.key = key;
            this.__v_isRef = true;
        }
        get value() {
            return this.target[this.key]; // 如果原对象是响应式的就会依赖收集
        }
        set value(newValue) {
            this.target[this.key] = newValue; // 如果原来对象是响应式的 那么就会触发更新
        }
    }
    // promisify
    // promisifyAll
    // 将某一个key对应的值 转化成ref
    function toRef(target, key) {
        return new ObjectRefImpl(target, key);
    }
    function toRefs(object) {
        const ret = isArray(object) ? new Array(object.length) : {};
        for (let key in object) {
            ret[key] = toRef(object, key);
        }
        return ret;
    }

    // 作业：调试 collectionHandlers ref 的api 和 computed
    class ComputedRefImpl {
        constructor(getter, setter) {
            this.setter = setter;
            this._dirty = true; // 默认取值时不要用缓存
            this.effect = effect(getter, {
                lazy: true,
                scheduler: () => {
                    if (!this._dirty) {
                        this._dirty = true;
                        trigger(this, 1 /* SET */, 'value');
                    }
                }
            });
        }
        get value() {
            if (this._dirty) {
                this._value = this.effect(); // 会将用户的反回值返回
                this._dirty = false;
            }
            track(this, 0 /* GET */, 'value');
            return this._value;
        }
        set value(newValue) {
            this.setter(newValue);
        }
    }
    // vue2 和 vue3 computed原理是不一样的
    function computed(getterOrOptions) {
        let getter;
        let setter;
        if (isFunction(getterOrOptions)) {
            getter = getterOrOptions;
            setter = () => {
                console.warn('computed value must be readonly');
            };
        }
        else {
            getter = getterOrOptions.get;
            setter = getterOrOptions.set;
        }
        return new ComputedRefImpl(getter, setter);
    }

    // createVNode  创建虚拟节点
    function isVnode(vnode) {
        return vnode.__v_isVnode;
    }
    // h(‘div',{style:{color:red}},'children'); //  h方法和createApp类似
    const createVNode = (type, props, children = null) => {
        // 可以根据type 来区分是组件 还是普通的元素
        // 根据type来区分 是元素还是组件
        // 给虚拟节点加一个类型
        const shapeFlag = isString(type) ?
            1 /* ELEMENT */ : isObject(type) ?
            4 /* STATEFUL_COMPONENT */ : 0;
        const vnode = {
            __v_isVnode: true,
            type,
            props,
            children,
            component: null,
            el: null,
            key: props && props.key,
            shapeFlag // 判断出当前自己的类型 和 儿子的类型
        };
        normalizeChildren(vnode, children);
        return vnode;
    };
    function normalizeChildren(vnode, children) {
        let type = 0;
        if (children == null) ;
        else if (isArray(children)) {
            type = 16 /* ARRAY_CHILDREN */;
        }
        else {
            type = 8 /* TEXT_CHILDREN */;
        }
        vnode.shapeFlag |= type;
    }
    const Text = Symbol('Text');
    function normalizeVNode(child) {
        if (isObject(child))
            return child;
        return createVNode(Text, null, String(child));
    }

    function createAppAPI(render) {
        return function createApp(rootComponent, rootProps) {
            const app = {
                _props: rootProps,
                _component: rootComponent,
                _container: null,
                mount(container) {
                    // let vnode = {}
                    // render(vnode,container);
                    // 1.根据组件创建虚拟节点
                    // 2.将虚拟节点和容器获取到后调用render方法进行渲染
                    // 创造虚拟节点
                    const vnode = createVNode(rootComponent, rootProps);
                    // 调用render
                    render(vnode, container);
                    app._container = container;
                }
            };
            return app;
        };
    }

    const PublicInstanceProxyHandlers = {
        get({ _: instance }, key) {
            // 取值时 要访问 setUpState， props ,data
            const { setupState, props, data } = instance;
            if (key[0] == '$') {
                return; // 不能访问$ 开头的变量
            }
            if (hasOwn(setupState, key)) {
                return setupState[key];
            }
            else if (hasOwn(props, key)) {
                return props[key];
            }
            else if (hasOwn(data, key)) {
                return data[key];
            }
        },
        set({ _: instance }, key, value) {
            const { setupState, props, data } = instance;
            if (hasOwn(setupState, key)) {
                setupState[key] = value;
            }
            else if (hasOwn(props, key)) {
                props[key] = value;
            }
            else if (hasOwn(data, key)) {
                data[key] = value;
            }
            return true;
        }
    };

    // 组件中所有的方法
    function createComponentInstance(vnode) {
        // webcomponent 组件需要有“属性” “插槽”
        const instance = {
            vnode,
            type: vnode.type,
            props: {},
            attrs: {},
            slots: {},
            ctx: {},
            data: {},
            setupState: {},
            render: null,
            subTree: null,
            isMounted: false // 表示这个组件是否挂载过
        };
        instance.ctx = { _: instance }; // instance.ctx._
        return instance;
    }
    function setupComponent(instance) {
        const { props, children } = instance.vnode; // {type,props,children}
        // 根据props 解析出 props 和 attrs，将其放到instance上
        instance.props = props; // initProps()
        instance.children = children; // 插槽的解析 initSlot()
        // 需要先看下 当前组件是不是有状态的组件， 函数组件
        let isStateful = instance.vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */;
        if (isStateful) { // 表示现在是一个带状态的组件
            // 调用 当前实例的setup方法，用setup的返回值 填充 setupState和对应的render方法
            setupStatefulComponent(instance);
        }
    }
    function setupStatefulComponent(instance) {
        // 1.代理 传递给render函数的参数
        instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
        // 2.获取组件的类型 拿到组件的setup方法
        let Component = instance.type;
        let { setup } = Component;
        // ------ 没有setup------
        if (setup) {
            let setupContext = createSetupContext(instance);
            const setupResult = setup(instance.props, setupContext); // instance 中props attrs slots emit expose 会被提取出来，因为在开发过程中会使用这些属性
            handleSetupResult(instance, setupResult);
        }
        else {
            finishComponentSetup(instance); // 完成组件的启动
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
    function finishComponentSetup(instance) {
        let Component = instance.type;
        if (!instance.render) {
            // 对template模板进行编译 产生render函数
            // instance.render = render;// 需要将生成render函数放在实例上
            if (!Component.render && Component.template) ;
            instance.render = Component.render;
        }
        // 对vue2.0API做了兼容处理
        // applyOptions 
    }
    function createSetupContext(instance) {
        return {
            attrs: instance.attrs,
            slots: instance.slots,
            emit: () => { },
            expose: () => { }
        };
    }
    // 他们的关系涉及到后面的使用
    // instance 表示的组件的状态 各种各样的状态，组件的相关信息 
    // context 就4个参数 是为了开发时使用的
    // proxy 主要为了取值方便  =》 proxy.xxxx

    let queue = [];
    function queueJob(job) {
        if (!queue.includes(job)) {
            queue.push(job);
            queueFlush();
        }
    }
    let isFlushPending = false;
    function queueFlush() {
        if (!isFlushPending) {
            isFlushPending = true;
            Promise.resolve().then(flushJobs);
        }
    }
    function flushJobs() {
        isFlushPending = false;
        // 清空时  我们需要根据调用的顺序依次刷新  , 保证先刷新父在刷新子
        queue.sort((a, b) => a.id - b.id);
        for (let i = 0; i < queue.length; i++) {
            const job = queue[i];
            job();
        }
        queue.length = 0;
    }

    function createRenderer(rendererOptions) {
        const { insert: hostInsert, remove: hostRemove, patchProp: hostPatchProp, createElement: hostCreateElement, createText: hostCreateText, createComment: hostCreateComment, setText: hostSetText, setElementText: hostSetElementText, } = rendererOptions;
        // -------------------组件----------------------
        const setupRenderEfect = (instance, container) => {
            // 需要创建一个effect 在effect中调用 render方法，这样render方法中拿到的数据会收集这个effect，属性更新时effect会重新执行
            instance.update = effect(function componentEffect() {
                if (!instance.isMounted) {
                    // 初次渲染
                    let proxyToUse = instance.proxy;
                    // $vnode  _vnode 
                    // vnode  subTree
                    let subTree = instance.subTree = instance.render.call(proxyToUse, proxyToUse);
                    // 用render函数的返回值 继续渲染
                    patch(null, subTree, container);
                    instance.isMounted = true;
                }
            }, {
                scheduler: queueJob
            });
        };
        const mountComponent = (initialVNode, container) => {
            // 组件的渲染流程  最核心的就是调用 setup拿到返回值，获取render函数返回的结果来进行渲染 
            // 1.先有实例
            const instance = (initialVNode.component = createComponentInstance(initialVNode));
            // 2.需要的数据解析到实例上
            setupComponent(instance); // state props attrs render ....
            // 3.创建一个effect 让render函数执行
            setupRenderEfect(instance, container);
        };
        const processComponent = (n1, n2, container) => {
            if (n1 == null) { // 组件没有上一次的虚拟节点
                mountComponent(n2, container);
            }
        };
        // ------------------组件 ------------------
        //----------------- 处理元素-----------------
        const mountChildren = (children, container) => {
            for (let i = 0; i < children.length; i++) {
                let child = normalizeVNode(children[i]);
                patch(null, child, container);
            }
        };
        const mountElement = (vnode, container) => {
            // 递归渲染
            const { props, shapeFlag, type, children } = vnode;
            let el = (vnode.el = hostCreateElement(type));
            if (props) {
                for (const key in props) {
                    hostPatchProp(el, key, null, props[key]);
                }
            }
            if (shapeFlag & 8 /* TEXT_CHILDREN */) {
                hostSetElementText(el, children); // 文本比较简单 直接扔进去即可
            }
            else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                mountChildren(children, el);
            }
            hostInsert(el, container);
        };
        const processElement = (n1, n2, container) => {
            if (n1 == null) {
                mountElement(n2, container);
            }
        };
        //----------------- 处理元素-----------------
        // -----------------文本处理-----------------
        const processText = (n1, n2, container) => {
            if (n1 == null) {
                hostInsert((n2.el = hostCreateText(n2.children)), container);
            }
        };
        // -----------------文本处理-----------------
        const patch = (n1, n2, container) => {
            // 针对不同类型 做初始化操作
            const { shapeFlag, type } = n2;
            switch (type) {
                case Text:
                    processText(n1, n2, container);
                    break;
                default:
                    if (shapeFlag & 1 /* ELEMENT */) {
                        processElement(n1, n2, container);
                    }
                    else if (shapeFlag & 4 /* STATEFUL_COMPONENT */) {
                        processComponent(n1, n2, container);
                    }
            }
        };
        const render = (vnode, container) => {
            // core的核心, 根据不同的虚拟节点 创建对应的真实元素
            // 默认调用render 可能是初始化流程
            patch(null, vnode, container);
        };
        return {
            createApp: createAppAPI(render)
        };
    }
    // createRenderer 目的是创建一个渲染器
    // 框架 都是将组件 转化成虚拟DOM -》 虚拟DOM生成真实DOM挂载到真实页面上

    function h(type, propsOrChildren, children) {
        const l = arguments.length; // 儿子节点要么是字符串 要么是数组 针对的是createVnode
        if (l == 2) { // 类型 + 属性 、  类型 + 孩子 
            // 如果propsOrChildren 是数组 直接作为第三个参数
            if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
                if (isVnode(propsOrChildren)) {
                    return createVNode(type, null, [propsOrChildren]);
                }
                return createVNode(type, propsOrChildren);
            }
            else {
                // 如果第二个参数 不是对象 那一定是孩子
                return createVNode(type, null, propsOrChildren);
            }
        }
        else {
            if (l > 3) {
                children = Array.prototype.slice.call(arguments, 2);
            }
            else if (l === 3 && isVnode(children)) {
                children = [children];
            }
            return createVNode(type, propsOrChildren, children);
        }
    }

    // runtime-dom 核心就是  提供domAPI方法了
    // 节点操作就是增删改查 
    // 属性操作 添加 删除 更新 (样式、类、事件、其他属性)
    // 渲染时用到的所有方法
    const rendererOptions = extend({ patchProp }, nodeOps);
    // vue中runtime-core 提供了核心的方法 用来处理渲染的，他会使用runtime-dom中的api进行渲染
    function createApp(rootComponent, rootProps = null) {
        const app = createRenderer(rendererOptions).createApp(rootComponent, rootProps);
        let { mount } = app;
        app.mount = function (container) {
            // 清空容器的操作 
            container = nodeOps.querySelector(container);
            container.innerHTML = '';
            mount(container); // 函数劫持
            // 将组件 渲染成dom元素 进行挂载
        };
        return app;
    }
    // 用户调用的是runtime-dom  -> runtime-core 
    // runtime-dom 是为了解决平台差异 （浏览器的）

    exports.computed = computed;
    exports.createApp = createApp;
    exports.createRenderer = createRenderer;
    exports.effect = effect;
    exports.h = h;
    exports.reactive = reactive;
    exports.readonly = readonly;
    exports.ref = ref;
    exports.shallowReactive = shallowReactive;
    exports.shallowReadonly = shallowReadonly;
    exports.shallowRef = shallowRef;
    exports.toRef = toRef;
    exports.toRefs = toRefs;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
//# sourceMappingURL=runtime-dom.global.js.map
