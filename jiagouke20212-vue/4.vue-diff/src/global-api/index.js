import { mergeOptions } from "../utils";

export function initGlobalAPI(Vue) {

    Vue.options = {}; // 全局属性 , 在每个组件初始化的时候 将这些属性放到每个组件上
    Vue.mixin = function(options) {
        // Vue.options = 合并后的结果
        this.options = mergeOptions(this.options,options);
        return this;
    }

    Vue.component = function name(params) {
        
    }
    Vue.filter = function name(params) {
        
    }
    Vue.directive = function name(params) {
        
    }
}
