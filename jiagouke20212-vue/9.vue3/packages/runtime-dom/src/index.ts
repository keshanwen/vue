// import { createRenderer } from "@vue/runtime-core";
import { createRenderer } from "@vue/runtime-core/src";
import { extend } from "@vue/shared";
import { nodeOps } from "./nodeOps";
import {patchProp} from  './patchProp'
// runtimeDOM 主要的目的是提供 操作的api

// 创建渲染器 createRenderer

const rendererOptions = extend({patchProp},nodeOps); // 渲染时需要用到这里的所有dom方法


// 操作dom 无非就是dom的增删改查 。属性、类名、事件、。。。

export function createApp(rootComponent,rootProps=null){
    const app = createRenderer(rendererOptions).createApp(rootComponent,rootProps);
    let {mount} = app;
    app.mount = function (container) { // 
        container = nodeOps.querySelector(container);
        container.innerHTML = ''; // 移除v-clock
        const proxy = mount(container);
        return proxy;
    }
    return app
}

// 继承特性 ， 子类 （不同的实现）需要实现方法，都调用父类的底层功能，


export * from '@vue/runtime-core'