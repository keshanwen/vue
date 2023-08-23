// 接口就是抽象的没有具体的实现
// 接口在开发中会被大量使用  对象（接口可以用来描述对象的形状， 来规定对象中的字段）

// 接口可以用来描述对象 类 函数 ....

// type Sum = ((a: string, b: string) => string) |((a: number, b: number) => number) ; // 自定义的类型一般名字都开头大写

interface ISum { // 用于描述函数的接口 , 接口不能被适用于联合类型， 接口的强大之处在于他的继承和实现
    (a: string, b: string): string
}
interface IArgs { // 描述对象的形状
    a: string,
    b: string
}
let sum = ({ a, b }: IArgs) => {
    return a + b
}

// 混合类型 函数可以当成函数 也可以当成引用类型   实现一个计数器每次调用+1
interface ICounter {
    count:number // 没有具体的实现, 如果给具体的值会认为他是一个字面类型， 没有具体实现的就叫成抽象的
    ():number
}
const counter:ICounter  = () => {
    return ++counter.count
}
counter.count = 1;
counter();


// 描述对象

interface IFruit { 
    color:string // 这两个标识必须存在
    taste:string
    size?:number // 标识可有可无
   // [key:string]:any //  其他属性是任意类型 , 名字随便写
}
let fruit1:IFruit = { // 后台返回数据 ， 我需要规定后台数据的格式。 
    color:'red',
    taste:'sweet',
    b:1,
} as IFruit
// 如果后台可能不确定size是否存在。

// interface MyFruit extends IFruit{ // 继承扩展
//     b:number,
//     c:number
// }
// interface IFruit{ // 同名的接口会进行合并, 会合并成一个接口
//     b?:number,
//     c?:number
// }
let fruit2 = { // 后台返回数据 ， 我需要规定后台数据的格式。 
    color:'red',
    taste:'sweet',
    b:1,
    c:2
} 
let fruit3:IFruit = fruit2; // 满足了安全性， 多的可以赋予给少的






export { }