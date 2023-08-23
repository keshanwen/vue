import { compileToFunction } from "./compiler";
import { initGlobalAPI } from "./global-api";
import { initMixin } from "./init";
import { lifeCycleMixin } from "./lifeCycle";
import { renderMixin } from "./render";
import { createElm, patch } from './vdom/patch';

function Vue(options) {
    this._init(options);
}

initMixin(Vue);
renderMixin(Vue);
lifeCycleMixin(Vue)


initGlobalAPI(Vue)


export default Vue;



// 1.Vue.component 注册成全局组件 内部会自动调用Vue.extend方法，返回组件的构造函数
// 2.组件初始化的时候，会做一个合并mergeOptions (自己的组件.__proto__ = 全局的组件)
// 3.内部会对模板进行编译操作 _c('组件的名字') 做筛查如果是组件就创造一个组件的虚拟节点 , 还会判断Ctor 如果是对象会调用Vue.extend, 所有的组件都是通过Vue.extend 方法来实现的(componentOptions 里面放着组件的所有内容 属性的实现，事件的实现，插槽的内容，Ctor)
// 4.创建组件的真实节点 ( new Ctor 拿到组件的实例 ，并且调用组件的$mount方法 （会生成一个$el 对应组件模板渲染后的结果）)  vnode.componentInstance = new Ctor()  vnode.componentInstance.$el => 组件渲染后结果
// 5.将组件的vnode.componentInstance.$el 插入到父标签中
// 6. 组件在 new Ctor()时 会进行组件的初始化，给组件再次添加一个独立的渲染watcher (每个组件都有自己的watcher)，更新时 只需要更新自己组件对应的渲染watcher （因为组件渲染时 组件对应的属性会收集自己的渲染watcher）

// 下次讲下根据源码调试源代码，调试组件创建流程、异步组件的实现原理、组件通信原理 及 keep-alive 原理

<Fragment>
hello
</Fragment>
