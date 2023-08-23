- 组件的渲染原理  先父后子
- 组件的更新流程 （属性）
- 函数式组件
- 异步组件
- 组件 通信方式
  - vm._props 更新此属性 页面可以重新渲染 prop
  - bus 同一个实例 new Vue().$on $emit
  - emit listeners 绑定事件  app.$on('fn')  app.$emit('fn')
  - provide/inject  父vm._provide   子、孙子 vm.parent._provide 和 需要inject的拿到定义到自己身上
  - $parent (父组件) $children (所有的子组件)  在创建时 会规定父子结构
  - attrs listeners  代表组件的所有属性 和 事件
  - ref 放到普通节点上 获取的是真实dom  放在组件上获取的是组件的实例
  - observable  
  
> 响应原理 组件渲染原理 diff算法 组件渲染机制整体流程
  - vuex 

- keep-alive的原理


let vm = new Vue({}); //node.events


vm.$on('data',function(){  // C

})
vm.$emit('data',function(){ // F

})

// 周日：写3个组件 1） 图片懒加载  2） 表单组件  3） 递归组件  剩下原理  attrs listeners ref   keep-alive的原理
// vue3

// vue-router vuex 
// ts
// vue3组件库 实战