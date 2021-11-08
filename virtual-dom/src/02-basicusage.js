import { h,init } from 'snabbdom'


let patch = init([])

let vnode = h('div#container',[
  h('h1','hello keke'),
  h('p','这是一个p标签哦')
])

let app = document.querySelector('#app')

let olVnode = patch(app,vnode)

setTimeout(() => {
 vnode = h('div#newid',[
   h('h1','i am h new'),
   h('p','这是一个p标签哦')
 ])
 patch(olVnode,vnode)

 // 清空页面元素
 // patch(olVnode,null) 错误写法
},2000)