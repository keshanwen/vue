import { observe } from "./observe"; // rollup-plugin-node-resolve
import { isFunction, isArray } from "./utils";
import Watcher from "./observe/watcher";
import Dep from "./observe/dep";

export function stateMixin(Vue) {
    Vue.prototype.$watch = function (key, handler, options = {}) {
        options.user = true // 是一个用户自己写 的 watcher

        new Watcher(this, key, handler, options)
    }
}

export function initState(vm){
    const opts = vm.$options;

    if(opts.data){
        initData(vm);
    }

    if (opts.computed) {
        initComputed(vm, opts.computed)
    }

    if (opts.watch) {
        initWatch(vm, opts.watch)
    }

}
function proxy(vm,key,source){ // 取值的时候做代理，不是暴力的把_data 属性赋予给vm, 而且直接赋值会有命名冲突问题
    Object.defineProperty(vm,key,{
        get(){ // ?
            return vm[source][key]; // vm._data.message
        },
        set(newValue){ // ?
            vm[source][key] = newValue; // vm._data.message = newValue
        }
    })
}
function initData(vm){
    let data = vm.$options.data; // 用户传入的数据

    // 如果用户传递的是一个函数 则取函数的返回值作为对象 ， 如果就是对象那就直接使用这个对象
    // 只有根实例可以data是一个对象

    // data 和 vm._data 引用的是同一个人 -》 data被劫持了  vm._data也被劫持
    data = vm._data =  isFunction(data) ? data.call(vm) : data; // _data 已经是响应式的了

    // 需要将data变成响应式的 Object.defineProperty， 重写data中的所有属性
    observe(data); // 观测对象中的属性



    for(let key in data){ // vm.message => vm._data.message
        proxy(vm,key,'_data');// 代理vm上的取值和设置值 和  vm._data 没关系了
    }
}


function initWatch(vm, watch) {
    for (let key in watch) {
        let handler = watch[key]

        if (isArray(handler)) {
            for (let i = 0; i < handler.length; i++) {
                createWatcher(vm, key, handler[i])
            }
        } else {
            createWatcher(vm, key, handler)
        }
    }
}

function createWatcher(vm, key, handler) {
    return vm.$watch(key, handler)
}

function initComputed(vm, computed) {
    const watchers = vm._computedWatchers = {}
    for (let key in computed) {
        const userDef = computed[key]
        // 依赖的属性变化就重新取值 get
        let getter = typeof userDef === 'function' ? userDef : userDef.get

        // 计算属性本质就是 watcher
        // 将 watcher 和属性 做一个映射
        watchers[key] = new Watcher(vm, getter, () => { }, {
            lazy: true  // 默认不执行
        })

        // 将 key 定义在 vm 上
        defineComputed(vm, key, userDef)
    }
}

function createComputedGetter(key) {
    return function computedGetter() { // 取计算属性 走的是这个函数
        // this._computedWatchers 包含着所有的计算属性
        // 通过 key 可以拿到对应的watcher, 这个watcher 中包含了 getter
        let watcher = this._computedWatchers[key]

        // 脏就是 要调用用户的 getter 不脏就是不要调用 getter
        if (watcher.dirty) {
            watcher.evaluate()
        }

        // 如果当前取完值后 Dep.target 还有值 需要继续向上收集
        if (Dep.target) {
            // 计算属性 watcher 内部有两个dep, firsteName lastName
            watcher.depend() // watcher 里对应了 多个dep
        }

        return watcher.value
    }
}

function defineComputed(vm, key, userDef) {
    let sharedProperty = {}
    if (typeof userDef === 'function') {
        sharedProperty.get = userDef
    } else {
        sharedProperty.get = createComputedGetter(key)
        sharedProperty.set = userDef.set
    }
    Object.defineProperty(vm, key, sharedProperty) // computed 就是一个 defineProperty
}