import { isArray, isInteger } from "@vue/shared/src";

export function effect(fn, options: any = {}) { // fn 不具备数据变化了就更新视图
    let effect = createReactiveEffect(fn, options); // 把fn包装成一个响应式的函数
    if (!options.lazy) {
        effect();
    }
    return effect
}
let uid = 0;
let activeEffect; // 此模块内唯一的一个变量
function createReactiveEffect(fn, options) {
    const effect = function () {
        // 我需要将effect暴露到外层
        activeEffect = effect; // Dep.target = watcher

        fn(); // 当我执行用户传入的函数时 会执行get方法
        activeEffect = null;

    }
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
export function track(target, type, key) { // {obj:name=> [effect,effect]}  weakMap : (map){key: new Set()}
    if (!activeEffect) { // 说明取值操作是在effect之外操作的 
        return
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
        dep.add(activeEffect)
    }
    // 制作一个依赖收集的关联列表
}
export function trigger(target, key, value, type) { // ? 会引起 没用到的属性修改也会更新 
    const depsMap = targetMap.get(target); // 先看一下有没有收集过依赖

    if (!depsMap) return; // 如果没有收集过 直接跳过


    // 为了实现批处理 我们把所有的effect放到一个set中 ，做一下去重 
    const effectsQueue = new Set();
    const add = (effectsToAdd) => {
        if (effectsToAdd) effectsToAdd.forEach(effect=>effectsQueue.add(effect));
    }
    // 如果修改的是数组 并且改的是长度 要做一些处理  
    if (isArray(target) && key == 'length') {
        // value; // 是数组长度   depsMap 存放的key 可能是索引 如果索引大于数组长度 修奥触发更新
        depsMap.forEach((dep, depKey) => { 
            // [1,2,3]  arr[2]  arr.length = 1  3=> undefined
            // [1,2,3]  arr[2]  arr.length = 100  3=> 3
            if (depKey == 'length' || value < depKey) {
                add(dep)
            }
        })
    } else {
        if (type == 'add') { // 新增逻辑 需要触发更新 触发length的更新 针对的是数组 
            if (isArray(target) && isInteger(key)) {
                add(depsMap.get('length'))
            }else{ // 对象新增逻辑, 对象新增逻辑也要触发对应的更新
                add(depsMap.get(key))
            }
        } else {
            const effects = depsMap.get(key); // 找到此属性对应的effect列表 ，直接执行即可
            add(effects)
        }
    }
    effectsQueue.forEach((effect:any)=>{
        if(effect.options.scheduler){
            effect.options.scheduler(effect)
        }else{
            effect()
        }
    });
    
}