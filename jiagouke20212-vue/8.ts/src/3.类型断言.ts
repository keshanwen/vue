// ts 出现的目的就是为了代码的安全


// 联合类型 默认就是并集的关系 

let strOrNumber: number | string; // 如果联合类型不赋予任何类型 那么他只能调用多个类型中间的公共方法
// strOrNumber.toString(); // 注意一般情况下 联合类型都需要赋值后使用
strOrNumber = 123;
strOrNumber.toFixed(2);
strOrNumber = 'abc';
strOrNumber.split('');



let ele: HTMLElement | null  = document.getElementById('app');

ele!.style.color = 'red'; // ! 表示非空断言 ，一定不为空。 如果出现为空的清空，自行承担

// es10的语法 链可选运算符 js的语法 用来取值的  下面这两个都是js语法
ele?.style.color // 表示ele有值才取 style属性
// ||
console.log(false ?? 2); // 过滤前一个值是不是null 或者undefined，如果是null/ undefined 则返回后面的结果


// 类型断言来处理为空的情况  as 语法

(ele as HTMLElement).style.color = 'red'; // 强制断言成一个类型
(<HTMLElement>ele).style.color = 'red'; // 可能和jsx冲突 
let sn: number | boolean;
(sn! as number).toFixed(2); // 断言只能用于断言存在的类型


sn! as any as string // 双重断言 一般不建议使用，会破环数据的原有类型

// 字面量类型  类似枚举 （固定的值）  通过type关键字来自定义类型
type COLOR = 'red' | 'yellow' | 'blue';
let color:COLOR = 'red'

// 联合类型 ， 非空，强转 ，字面量类型



export { }