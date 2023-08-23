## 看源码的思路:
- 1.就是先找package.json  找到了 scripts.build
- 2.找到打包时采用的入口方便分析 esm cjs / runtime,compiler = full 
- 3.找到打包入口，文件在 platform/web目录 entry-runtime-with-compiler
- 4.因为weex基于vue实现跨平台 （vue2 扩展并不好 ） vue3 采用了monorepo的方式 实现一个仓库下管理多个模块
- 5.runtime-with-compiler实现了一个$mount方法，可以处理用户参数中包含template属性，会将template转化成render函数， 最终调用runtime/index.json


## 找到Vue的构造函数 
- core/instance/index.js 提供Vue的构造函数
- core/index.js 对Vue构造函数扩展全局的api方法 Vue.mixin
- platform/runtime/index.js 扩展 transition / v-model /v-show 等功能  __patch__
- platform/entry-runtime-with-compiler/实现$mount重写 ,实现模板编译功能



## 全局Api