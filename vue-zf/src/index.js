import { initMixin } from "./init";
import { lifeCycleMixin } from "./lifeCycle";
import { renderMixin } from "./render";
import { stateMixin } from './state'
import { initGlobalApi } from "./global-api/index"

// vue 要如何实现，原型模式，所有的功能都通过原型扩展的方式来添加
function Vue(options){
    this._init(options); // 实现vue的初始化功能
}

initMixin(Vue);
renderMixin(Vue);
lifeCycleMixin(Vue)
stateMixin(Vue)

initGlobalApi(Vue)



import { compileToFunction } from './compiler/index.js';
import { createElm, patch } from './vdom/patch.js'

// diff 核心
let oldTemplate = `<div>
    <li key="A">A</li>
    <li key="B">B</li>
    <li key="C">C</li>
    <li key="D">D</li>
</div>`; // 在最外层创建了一个根节点 vue3可以

let vm1 = new Vue({ data: { message: 'hello world' } })
const render1 = compileToFunction(oldTemplate)
const oldVnode = render1.call(vm1); // 虚拟dom
document.body.appendChild(createElm(oldVnode));

// v-if   v-else
let newTemplate = `<div >
<li key="D">D</li>
<li key="A">A</li>
<li key="B">B</li>
<li key="C">C</li>
</div>`;
let vm2 = new Vue({ data: { message: 'zf' } });
const render2 = compileToFunction(newTemplate)
const newVnode = render2.call(vm2); // 虚拟dom
// 根据新的虚拟节点更新老的节点，老的能复用尽量复用

setTimeout(() => {
    patch(oldVnode, newVnode);
    console.log('setTimeout~~~~~')
}, 2000);




// 导出vue给别人使用
export default Vue;



// 1.new Vue 会调用_init方法进行初始化操作
// 2.会将用户的选项放到 vm.$options上
// 3.会对当前属性上搜素有没有data 数据   initState
// 4.有data 判断data是不是一个函数 ，如果是函数取返回值 initData
// 5.observe 去观测data中的数据 和 vm没关系，说明data已经变成了响应式
// 6.vm上像取值也能取到data中的数据 vm._data = data 这样用户能取到data了  vm._data
// 7.用户觉得有点麻烦 vm.xxx => vm._data
// 8.如果更新对象不存在的属性，会导致视图不更新， 如果是数组更新索引和长度不会触发更新
// 9.如果是替换成一个新对象，新对象会被进行劫持，如果是数组存放新内容 push unshift() 新增的内容也会被劫持
// 通过__ob__ 进行标识这个对象被监控过  （在vue中被监控的对象身上都有一个__ob__ 这个属性）
// 10如果你就想改索引 可以使用$set方法 内部就是splice()



// 如果有el 需要挂载到页面上