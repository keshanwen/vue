// ts typescript 就是给js语言增加type  掌握ts中有哪些类型，什么时候用写这个类型

// ts 是具备类型推导的功能，自动会根据等号右边的值推导等号左边
// 如果在ts中不指定类型，那么ts默认无法推导，结果就是any, 可以被任何类型所赋值

// ts 中的类型都是在:后面 :后面跟着的都是类型


// ts中的"基础"类型
// 1 - 3 
let str: string = 'zf'; 
let num: number = 100;
let bool: boolean = true;

// 在我们的js中 当我们调用方法的时候 （装箱的概念）

1..toString(); // 如果默认调用基础类型上的方法，会有装箱的功能，就是把基础类型变成对象类型

// 类是可以充当类型， 用来描述实例的
// let b1:boolean = true;
// let b2:Boolean = true;
// let b3:boolean = new Boolean(true); // 这里不能赋值 因为实例无法赋值给基本数据类型


// ts中还新增了一个类型 元组 表示长度和类型是固定的数组 
// 4
let tuple: [string, number, boolean] = ['zf', 100, true]; // 不能通过索引增加数据
tuple[1] = 200;
tuple.push('abc'); // 元组在通方法 添加数据时只能添加已经存在的类型



// 数组特点：存放一类类型的集合 , 联合类型可以设置数组的类型 5
let arr: (number | string)[] = [1];
arr.push('abc')

let arr2: any = {}
let arr3: any[] = [{},{}]; // any[] 表示这个变量时一个数组里面放的内容可以时随意的
let arr4: Array<(number | string)> = [1];

// 6.枚举类型  做成一组枚举值  (状态码， 固定的标识)

enum AUTH {
    ADMIN = 'a',
    MANAGER = 'b',
    USER = 'c'
}
// 默认枚举的功能时具备反举，最终编译的结果就是一个对象 ，如果没有默认值 会自动给出下标 是递增的
// 如果当前枚举的值不是一个数字，后面的结果都需要进行手动标识, 如果不是数字不会生成反举
console.log(AUTH.ADMIN)
console.log(AUTH.MANAGER)


const enum COLOR { // 常量枚举 不会编译出额外的代码来，在不需要反举的情况下，我们通常使用常量枚举
    red,
    yellow,
    blue
}





console.log(COLOR.red)
// console.log(AUTH[1])
// console.log(AUTH[2])
// 一个用户 它既有 admin权限有有 用户权限
let color = {
    admin:1,      //  00000001 // 1
    manager:1<<1, //  00000010 // 2
    user:1<<2     //  00000100 // 4
}

// let role = color.admin | color.user; // 此角色既有admin 又有用户

// 都是1才是1    101 & 010 == 0
// console.log(role & color.manager ); // 用 位运算符来计算权限的组合关系

// vue3 里面会做节点标记  动态样式 1 动态文本 2 动态属性 4
// 默认对象没有类型，不能进行标识









// 写完的结果 默认添加export {} 表示当前是一个模块，
export { }