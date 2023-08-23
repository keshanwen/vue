// ts 中有一个比较重要的概念 命名空间 

// 内部模块 （自执行函数） -》  外部模块  import / export

// 用来解决文件中命名冲突的问题



export namespace Zoo {
    export let m1 = '猴子'
}
// export Zoo1 


export namespace Zoo {
    export let m2 = '猴子'
}

// 命名合并问题 ， 能合并的东西有 （接口同名可以合并） （函数和命名空间可以合并） （命名空间和命名空间可以合并） （命名空可以和类来合并） (类和接口合并)
function Fn() {

}
namespace Fn { // 给函数扩展属性
    export let a = 1
    export let b = 2;
}
interface Person { // 给Person类原型扩充属性
    say(): void
}
class Person {

}
namespace Person { // 给类本身扩充属性
    export function say() { }
}
Person.say
let person = new Person();
person.say


// 给window添加属性

declare global { // 接口的合并 ，给window上添加类型 , 如果是全局的变量扩展的时候 需要使用 declare global 否则无法访问
    interface Window {
        xxx: string
    }
    interface String {
        xxx(): void
    }
}


String.prototype.xxx = function () {

}
window.xxx
// declare 声明的意思 
// 如果jquery是在cdn中引入的， 那么当前模块中是不会引入jquery的

// 用来声明一个类型
declare function $(selector:string):{ // .d.ts ts中的声明文件 ，声明（不是正常引入的类型） 全部使用 declare关键字
    css(val:string):void
};
declare namespace $ { // declare 中的属性默认就是导出不需要增加导出逻辑
    namespace fn{ // $.fn
        function extend():void
    }
}
$('').css('xxx');

$.fn.extend()

// ts 可以帮助开发这提供友好的提示

export { }


declare module $ { // .d.ts
  }