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


// 先生成一个虚拟节点
// let vm1 = new Vue({
//     data() {
//         return { name: 'jw' }
//     }
// })
// let render1 = compileToFunction(`<div>
//     <li key="A">A</li>
//     <li key="B">B</li>
//     <li key="C">C</li>
//     <li key="D">D</li>
// </div>`)
// let oldVnode = render1.call(vm1); // 第一次的虚拟节点
// let el1 = createElm(oldVnode);
// document.body.appendChild(el1);

// let vm2 = new Vue({
//     data() {
//         return { name: 'zf' }
//     }
// })
// // 在生成一个新的虚拟节点  patch
// let render2 = compileToFunction(`<div>
//     <li key="F" style="color:pink">F</li>
//     <li key="B" style="color:yellow">B</li>
//     <li key="A" style="color:blue">A</li>
//     <li key="E" style="color:red">E</li>
//     <li key="P" style="color:red">P</li>
// </div>`)
// let newVnode = render2.call(vm2);

// setTimeout(() => {
//     patch(oldVnode, newVnode); // 比对两个虚拟节点的差异，更新需要更新的地方
// }, 2000);

export default Vue;