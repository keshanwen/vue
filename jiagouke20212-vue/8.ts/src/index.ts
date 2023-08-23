 // 默认引入第三方模块需要给一个解析方式
// import $ from 'jquery'


// import png from './a.png'

// import component from 'a.vue'
// component.install

// import export es6语法  / export =  和 import 语法 node中使用 
// 默认全部使用import 和 export即可

// import r = require('./a')


let a:string = 'hello'




// npm i --save-dev @types/jquery 很多第三方模块 都已经有人写好了声明文件，（声明文件目的是让不支持ts的模块也能有语法提示 （编写提示规则））

// 默认先查找 node_modules 某个模块下是否有 types字段, 如果模块本身没有types字段会查找index.d.ts
// 当前代码会自动去查找node_modules 下 @types下的文件，jquery ->  默认会去查找 index.d.ts
// 如果没有文件 可以配置 include 变量包含需要的ts文件
// 对于自定义文件 需要自己配置 path属性  "baseUrl": "./", 可以查找自定义的模块


export {a}



