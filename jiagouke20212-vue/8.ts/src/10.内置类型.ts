// 条件类型



// 鱼需要水   鸟需要天空
interface Bird {
    name: '鸟' // 字面量类型
}
interface Fish {
    name: '鱼'
}
interface Sky {
    color: '蓝色'
}
interface Water {
    color: '白色'
}
// ts 中有一个条件分发的概念， 联合类型才会发生条件分发
type MyType<T> = T extends Bird ? Sky : Water; // 条件类型就是三元表达式

// 默认都是裸类型 就是这个泛型没有被包裹起来，这时候他是具备分发能力的
// 如果泛型被包裹起来了 

type MyBird = MyType<Fish | Bird>; // Water | Sky  只有联合类型才能进行分发操作，不是联合类型，没有分发的功能

// 一下要说的内容都是ts中自带的类型，咱们亲自实现一下

// type Exclude<T, U> = T extends U ? never : T;

// 我需要拿多的去少的里面找，如果找不到说明要留下这一个
type MyExclude = Exclude<string | number | boolean, number | string>; // never | never | boolean


// 如果后续想在多的类型中去掉某一个可以考虑用Exclude类型
type Extract<T, U> = T extends U ? T : never;
type MyExtract = Extract<string | number | boolean, number | string>;


let el = document.getElementById('app');
// 可以去处null 和 undefiend 类型

type NonNullable<T> = T extends null | undefined ? never : T;
type MyNon = NonNullable<typeof el>;




// 以上都是借助于条件了条件类型

interface ICompany {
    name: string,
    address: string
}

interface IPerson { // 先定义最大的接口 -》 小的接口
    name: string,
    age: number,
    company: ICompany
}
// 让属性都变成可选属性

// type Partial<T> = { [K in keyof T]?: T[K] }
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] }
type MyPartial = DeepPartial<IPerson>; // 默认的partial 只会让第一层变成可选的
let person: MyPartial = {
    company: {
        name: '张三'
    }
}
// type Required<T> = { [K in keyof T]-?: T[K] }
// type Readonly<T> = { readonly [K in keyof T]: T[K] }
type OptionalPerson = Readonly<Required<Partial<IPerson>>>; // 去掉问号  变成仅读的模式


// Pick 挑选出来想要的结果
// type Pick<T, K extends keyof T> = { [P in K]: T[P] };
type MyPerson = Pick<IPerson, 'name' | 'age'>; //'name' | 'age' => {name:IPerson[name],age:IPerson[age]} 

// 就是在对象中取出需要的属性 挑选


type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>
type MyPerson2 = Omit<IPerson, 'name' | 'age'> // IPerson -> 所有的key  忽略掉name， 把其他的挑出来

// record 记录 可以描述对象类型

// type Record<T extends keyof any, K> = {
//     [P in T]: K // [string]：string | number
// }

function map<T extends keyof any, K, U>(obj: Record<T, K>, fn: (item: K, key: T) => U): Record<T, U> {
    let result = {} as Record<T, U>
    for (let key in obj) {
        result[key] = fn(obj[key], key)
    }
    return result;
}
let obj = map({ a: 'zf', age: 12 }, function (item, key) { // name=> abc age=> abc
    return 123
}); // map方法 你给一个对象 ——》 转化成另一个对象

// Exclude Extract NonNullable Parital readonly required 
// Pick Omit Record


type Pick<T, K extends keyof T> = { [P in K]: T[P] };
type Exclude<T, U> = T extends U ? never : T;

// 类型推断infer
function getPointer(x:string,y:string,z:string){
    return {x,y,z}
}

// typeof keyof extends in ? -? readonly  infer 在哪里就推断哪里的结果
// type ReturnType<T extends (...args:any[])=>any> =  T extends (...args:any[])=> infer R ? R : any
type MyReturn  = ReturnType<typeof getPointer>;
// type Parameters<T extends (...args:any[])=>any> =  T extends (...args: infer P)=> any? P : any
type MyParamaters = Parameters<typeof getPointer>;

class Person {
    constructor(name:string,age:number,address:string){}
}
type ConstructorParameters<T extends  {new (...args:any[]):any}> =  T extends  {new (...args:infer R):any} ? R : any;
type MyConstructor = ConstructorParameters<typeof Person>



type InstanceType<T extends  {new (...args:any[]):any}> =  T extends  {new (...args:any[]):infer R} ? R : any;
type MyInstanceType = InstanceType<typeof Person>


// infer 可以根据内容位置进行推断结果的类型

// unknown 我们可以用 unknown 来替换掉any unknown 是any的安全类型 

let a:unknown = {a:1}; // 任何类型都可以赋值给unknown 但是any不够安全，因为可以调用属性 。但是unknown 不能进行取值操作

// 使用的时候 尽量用unknown 来替换掉 any类型

type a = unknown & string; // 和任何类型做联合类型都是unknown, unkown和其他类型做交集获取的永远是其他类型, 不支持keyof unknown

type x = keyof unknown
type xx = never extends unknown? true:false; 

// 我想判断一个值是否是某个类型 



type union = { name: string } | { age: number }

// 用数组包裹
type NakeArray<T> = (T extends any ? Array<T> : never) extends Array<infer R> ? R : never
type toSection1 = NakeArray<union>

// 用对象包裹
type NakeObj<T> = (T extends any ? {ar: T} : never) extends {ar: infer R} ? R : never
type toSection2 = NakeObj<union>

// 用函数 (a) => void 包裹
type NakeFnc<T> = (T extends any ? (a: T)=>void : never) extends (a: infer R)=>void ? R : never
type toSection3 = NakeFnc<union>

// toSection1, toSection2  -->  { name: string } | { age: number } 
// toSection3              -->  { name: string } & { age: number } 
// 为什么会出现不同的结果？ 


export { };
