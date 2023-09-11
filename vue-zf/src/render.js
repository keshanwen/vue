import { isObject } from "./utils"
import { createElement, createTextElement } from "./vdom"

export function renderMixin(Vue){
    Vue.prototype._c = function () { // createElement 创建元素型的节点
        const vm = this;
        return createElement(vm,...arguments)
    }
    Vue.prototype._v = function (text) { // 创建文本的虚拟节点
        const vm = this;
        return createTextElement(vm,text); // 描述虚拟节点是属于哪个实例的
    }
    Vue.prototype._s = function (val) { // JSON.stingfiy()
        if(isObject(val)) return JSON.stringify(val);
        return val;
    }
    Vue.prototype._render = function () {
        const vm = this; // vm中有所有的数据 vm.xxx => vm._data.xxx
        let { render } = vm.$options; // 就是我们解析出来的 render 方法，同事也有可能是用户写的
        let vnode = render.call(vm);
        return vnode;
    }
}