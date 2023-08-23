

// 有个方法可以代替new 方便传递参数 



// 类只能描述实例，但是我们现在要描述类的本身
// typeof Cat 可以取出这个类的类型  (在ts中的typeof 只能用去取已有的类型的类型)
// new (name: string, age: number) => Cat 表示是一个构造函数 ，我们限制返回的实例
type MyType<T> = new (name: string, age: number) => T;

interface IMyType<T> {
    new(name: string, age: number): T
}
class Cat {
    constructor(public name: string, public age: number) { }
}
class Dog {
    constructor(public name: string, public age: number) { }
}
function createInstace<T>(clazz: MyType<T>, name: string, age: number) {
    return new clazz(name, age)
}
let r = createInstace(Cat, 'tom', 13); // 如果不传递值 默认会根据所在的位置来传递类型
// 如果无法自动推断类型 ，而且没有传递 那么默认就是unkown类型



// 我希望产生一个数组 ： 给数组长度和内容 -> 数组的结果

interface ICreateArray { // 泛型定义在外面 表示使用类型的时候确定类型
    <T>(times: number, item: T): T[] // 写在里面 表示在执行的时候确定类型
}

let createArray: ICreateArray = <T>(times: number, item: T): Array<T> => {
    let result = []
    for (let i = 0; i < times; i++) {
        result.push(item);
    }
    return result
}
let arr = createArray(3, 'a');

// 泛型可以传入多个类型 两个泛型 元组的交换
function swap<A, B>(tuple: [A, B]): [B, A] {
    return [tuple[1], tuple[0]]
}
let result = swap(['a', 1]);
type NTuple = typeof result; // 取对应值的类型 typeof Cat


// 实现一个forEach方法 能进行数组的循环

// type TFn<T> = (item: T,index:number) => void

// 在写类型时如果泛型定义在函数的前面 ，表示的是执行的时候确定类型
// 如果放在接口或者type的后面，表示使用这个类型的时候就定义好了具体的类型了
interface IFn<T> {
    (item: T, index: number): void
}
let forEach = <T>(arr: T[], fn: IFn<T>) => { // 兼容性
    for (let i = 0; i < arr.length; i++) {
        fn(arr[i], i);
    }
};
forEach([1, 2, 3, 4, 5], function (item) {
    console.log(item);
});
// 泛型约束，类型的兼容性，高级类型（条件），内置类型， 自定义类型


// 泛型无法做运算   如果两个字符串相加 那么返回的就是字符串 两个数字相加返回的就是数字

// 可以限制泛型的范围 -》 泛型约束
// 约束不代表等于 只是有string的特性，不能说string 和 T 就是一个东西


function sum<T extends string>(a: T, b: T): T {
    return (a + b) as T; // 只是告诉返回值是T ,但是你没法限制 a 和 b能相加 
}
// sum(1,2);
// sum('a', 'b');

// 如果写好一个具体的类型，表示显示死了 传入的类型，看一下当前传入的内容是否带有某个属性

function finish<T extends { kind: string }>(val: T) { // 我们希望限制传入的内容 带有能游泳的标识

}
finish({ kind: '草鱼', a: 1 }); // redux type属性

// 根据泛型 产生多个类型 默认泛型 
// 产生一个对象 name 属性可以随时更改类型

type MType<T = string> = { name: T }

type MName1 = MType
type MName2 = MType<number>

// 用默认值来规定泛型的不确定性，因为默认不传递参数 值是unkown

// 我们期望在一个对象中能获取对象中的属性

function getVal<T extends object, K extends keyof T>(val: T, key: K) {

}
type r1 = keyof string; // 联合类型 并集 
type r2 = keyof any; // string | number | symbol  都能作为key就是这三个属性

getVal({ a: 1, b: 2 }, 'b');

// 交叉类型   交叉表示两个人共有的部分 

interface A { // 100
    handsome: string
    type:number
}
interface B { // 5
    high: string
    type:string
}
type AB = A & B; // 交集

let person:AB = {
    handsome:'帅',
    high:'高',
    type:'abc' as never
}

let a:B = person

// 两个对象 我想做一个合并 
function mixin<T extends object , K extends object>(o1:T,o2:K){
    return {...o1,...o2}
}
let r1 = mixin({a:1},{a:'abc',b:2,c:3}); // 这里面如果两个属性都存在 会出现问题


// | 并集  & 交集




export { }
