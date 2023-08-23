// 内置类型 Partial extract exclude  /  readonly  Pick   Omit  
// 推断 returnType 
// keyof typeof in ......

// 求两个类型的差集
let person1 = {
    name: 'zf',
    age: 12,
    address: '霍营'
}
let person2 = { // name | age | adress  name  先 exclude -> Omit / extract -> pick
    name: 'jw'
}
type Person1 = typeof person1;
type Person2 = typeof person2;

type Diff<T extends object, K extends object> = Omit<T, keyof K>
type MyDiff = Diff<Person1, Person2>

// 求交集 在person1 和 person2 中 删除掉不需要的属性  (不是交叉类型 ，是两个类型中共同的属性)

type Inter<T extends object, K extends object> = Pick<T, Extract<keyof T, keyof K>>
type MyInter = Inter<Person1, Person2>

// 并集 T & K => 如果类型不一致 会出现错误 never
let person3 = {
    name: 'zf',
    age: 12,
    address: '霍营'
}
let person4 = {
    name: 'jw',
    age: '18'
}
type Person3 = typeof person3;
type Person4 = typeof person4
type Merge<T extends object, K extends object> = Omit<T, keyof K> & K;

type Compute<T> = { [K in keyof T]: T[K] }; // 拓展运算符
type NewPerson =Compute<Merge<Person4, Person3>>; // 仅仅是为了自己看方便 


// 覆盖  (后者的类型 覆盖掉前者的类型)
let person5 = {
    age: 12,
    address: '霍营'
}
let person6 = {
    name: 'jw',
    age: '18'
}
// 6把5重写了 不是合并 -> {age:'string',adress:string}

type Person5 = typeof person5;
type Person6 = typeof person6
// 先求两个类型的交集 交叉的部分 ， 和 另一个对象忽略交叉的部分 -》 在进行合并
type Overwrite<T extends object, K extends object> = Inter<K,T> & Omit<T,keyof K>
type MyOverwrite = Compute<Overwrite<Person5,Person6>>;

let overwrite:MyOverwrite = {
    age:'18',
    address:''
}
// Extract exclude  / Omit pick  自己实现的 不是内置的
export {}