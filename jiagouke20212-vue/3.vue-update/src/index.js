import { initGlobalAPI } from "./global-api";
import { initMixin } from "./init";
import { lifeCycleMixin } from "./lifeCycle";
import { renderMixin } from "./render";

// vue 要如何实现，原型模式，所有的功能都通过原型扩展的方式来添加
function Vue(options){
    this._init(options); // 实现vue的初始化功能
}

initMixin(Vue);
renderMixin(Vue);
lifeCycleMixin(Vue)


initGlobalAPI(Vue)



// 导出vue给别人使用
export default Vue;


// 只有根组件的情况：  每个属性都有一个dep
// 1.vue里面用到了观察者模式，默认组件渲染的时候 ， 会创建一个watcher，（并且会渲染视图）
// 2.当渲染视图的时候，会取data中的数据， 会走每个属性的get方法， 就让这个属性的dep记录watcher
// 3.同时让watcher也记住dep （这个逻辑目前没用到）   dep和watcher是多对多的关系，因为一个属性可能对应多个视图，一个视图对应多个数据
// 4.如果数据发生变化，会通知对应属性的dep，依次通知存放的watcher去更新

