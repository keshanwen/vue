// 都是从安全性考虑 ts中的兼容性   兼容性是在把一个变量赋值给另一个变量才产生的

// 1.基本类型的兼容性 

let v1!: string | number;

let v2!: string | number | boolean

v2 = v1; // 少的类型可以赋予给多的  js 中的typeof 返回的是一个字符串类型

// 2.接口类型兼容   (只要多的类型， 可以赋予给少的)  鸭子类型检测 （不关心内容， 只看长得一不一样）
interface A1 {
    name: string,
    age: number
}
interface A2 {
    name: string,
    age: number,
    adrress: string
}
let a1!: A1
let a2!: A2

a1 = a2;
// 3.函数的兼容性  参数 、 返回值 
let sum1 = (a: string, b: string): string | number => 1
let sum2 = (a: string): string => ''
// 之前写过一个map方法  我定义的时候 有2个参数，但是用户使用的时候只用了一个
sum1 = sum2;// 定义了a，b 。 你只用一个c 也是可以的

// 类的类型  兼容他的检测是符合鸭子检测的 （实例 只要实例一样 那就是一个东西）
// 特殊的情况 就是类中如果带了 private protected 就不是一个东西了 （不兼容了）
class Person {
    public name = "张三"
}
class Animal {
    public name = "张三"
}
let p!: Person
let a!: Animal

p = a
a = p

// 枚举永远不兼容, 泛型是否兼容看最终的结果
enum E1 { }
enum E2 { }

// let e1!:E1;
// let e2!:E2

// e1 == e2

// 针对函数的抽象概念 参数是逆变的 和 返回值是协变的 可以返回儿子  （可以传父返子）

// 如果配置ts的话 可以设置成双向协变  (这个方式不考虑)

class GrandParent {
    house!: string
}
class Parent extends GrandParent {
    money!: string
}
class Son extends Parent {
    play!: string
}
// 此时当前的val可以处理 house 和 money
function getFn(cb: (val: Parent) => Parent) {

}
getFn((val: GrandParent) => new Son);
//                   这个val是标识类型的
function getFn1(cb: (val: number | boolean) => string | boolean) { 
    cb(true) // 这个地方是实参
}
// 1.string 
// 2.number|string| boolean
// val: number  = 1 | true

// 这个val 是形参， getFn1 传递的参数是一个函数 是实参
getFn1((val: number | boolean | string) => '');

export { }