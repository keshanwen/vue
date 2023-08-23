

// 函数 我们一般也会标识类型 ， 函数的参数，和函数的返回值
// 1.function来声明    2.表达式来声明

// 如果能自动推断出来的我们可以不用标识类型
type Sum = (c: string, d: string) => string; // 类型别名,类型可以复用
let sum: Sum = function (a: string, b: string) {
    return a + b;
}
// ts 特点就是在代码中使用时 会标识类型，方便提示
sum('a', 'b');

// 给函数表达式标识类型，只用希望赋值的类型满足这个类型，才会添加类型

// function函数只能标识参数类型和返回值类型
function sum1(a: string, b: string): string {
    return a + b
}


// 函数的参数可以做一系列的处理 可选参数，默认值，剩余运算符 和 js一样

function optional(a: string, b?: string, c?: string) { // 可选运算符只能放在最后一个

}
optional('a')

function defaultVal(a: string, b: string = '100') { // 可选运算符只能放在最后一个

}
defaultVal('a'); // 如果不填默认是默认值

function spread(...args: number[]) {

}
spread(1, 2, 3, 4)

function callThis(this:string,a: number, b: number, c: number) { // 用于标识函数类型中的this是什么类型
}

callThis.call('cbd', 1, 2, 3); // 对象标注类型 一般采用接口



// 函数的重载

// 给我一个字符串 -》  数组  'abc' => ['a','b','c']
// 给我一个数字  123 => [1,2,3]

function toArray(val:string):string[] // 对条件的限制
function toArray(val:number):number[]
function toArray(val: string | number): string[] | number[] { // 真实的实现
    if (typeof val == 'string') {
        return val.split('');
    } else {
        return val.toString().split('').map(item => Number(item));
    }
}
let arr = toArray(1)
let item = arr[0];

export { };
