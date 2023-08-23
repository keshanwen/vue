// declare let a:string

// declare module "*.png"


// declare module "*.vue" {
//     interface Vue{
//         install:()=>void
//     }
//     const vue:Vue
//     export = vue; // 这个语法是ts中自带的 为了兼容commonjs 语法
// }


declare let age:number; // 声明没有实现
declare class Person {}
// declare function fn():void;
declare interface Ixx{}
// declare function fn():void

declare enum Color  {
    Red,
    Yellow,
    Green
}

declare namespace $${ 
    function css():void;
    namespace fn{
        
    }
}
