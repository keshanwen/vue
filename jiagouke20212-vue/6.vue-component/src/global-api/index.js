import { isObject, mergeOptions } from "../utils";

export function initGlobalAPI(Vue) {

    Vue.options = {}; // 全局属性 , 在每个组件初始化的时候 将这些属性放到每个组件上
    Vue.mixin = function(options) {
        // Vue.options = 合并后的结果
        this.options = mergeOptions(this.options,options);
        return this;
    }
    // Vue.component -> Vue.extend

    Vue.options._base = Vue;
    // 等会我通过Vue.extend 方法可以产生一个子类，new 子类的时候会执行代码初始化流程 (组件的初始化)
    Vue.extend = function (opt) { // 会产生一个子类  data
        const Super = this;
        const Sub = function (options){ // 创造一个组件 其实就是 new 这个组件的类 （组件的初始化）
            this._init(options)
        }
        //  Object.create  Object.setPrototypeOf()
        // Sub.prototype.__proto__ = Super.prototype
        // function create(parentProtptype){
        //     const Fn = function(){}
        //     Fn.prototype = parentProtptype
        //     return new Fn;
        // }
        Sub.prototype = Object.create(Super.prototype); // 继承原型方法
        Sub.prototype.constructor = Sub; // Object.create 会产生一个新的实例作为 子类的原型，此时constructor 会指向错误
        Sub.options = mergeOptions(Super.options,opt); // 需要让子类 能拿到 我们Vue定义的全局组件

        return Sub;
    }

    Vue.options.components = {}; // 存放全局组件的
    Vue.component = function (id,definition) { // definition 可以传入对象或者函数
        let name = definition.name || id;
        definition.name = name;
        if(isObject(definition)){
            definition = Vue.extend(definition)
        }
        Vue.options.components[name] = definition; // 维护关系
    }
   
}
