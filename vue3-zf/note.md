## Vue3 和 vue2的区别
- Vue3 最主要的特点就是 小 和 快
- 移除了Vue2中不常用的内容 过滤器， 组件 Vue3 可以按需打包 借助了rollup可以支持函数的treeshaking能力 （提供了一些新增的组件） 只是兼容了vue2的核心api （不在考虑ie的兼容性问题） 
- 快 ： proxy （天生的拦截器 不需要重写属性，而且不用一上来就默认递归的）  (defineProperty递归 和 重写属性)
- 整体vue3架构发生了变化 (采用了monorepo 可以分层清晰，一个项目中维护多个项目，可以利用项目中的某个部分)  
- vue3 对编译时的内容 进行了重写  template -（增加了很多逻辑）》 render 函数 静态标记还有属性标记  patchFlag 动态标记 （比较哪些元素包含哪些属性 class，style，动态属性，指令。。。） 静态提升, 函数的缓存 。 全量比对： vue3 使用了最长子序列重写了diff算法 （这个和vue2基本没有太大差异）， 使用了vue3模板内部有一个概念叫blockTree。 如果你在vue中使用jsx就不会得到模板的优化， 可以在写jsx的时候 自己标记
- vue3 完全采用了ts来进行了重构 对ts兼容非常好  对this的推断也好  采用函数式的方式对ts的推断是非常好的
- CompositionApi Vue3的亮点 （逻辑分类-最终组合）  optionsApi 分散逻辑 (功能少 可以使用vue2的写法)


- vue3 由5个核心模块组成
- @vue/reactivity
- @vue/compiler-dom 浏览器来使用    编译  template -》 render
- @vue/compiler-core 核心编译模块

》 dom操作的api和 操作属性的api
- @vue/runtime-dom vue3 默认的 安装vue-next 默认的入口就是这个runtime-dom  虚拟dom-> 真实dom
- @vue/runtime-core 底层不依赖于平台的模块