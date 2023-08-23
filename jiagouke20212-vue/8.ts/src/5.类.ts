// 类（函数）语法糖, 构造函数的区别 (函数 不会new)
// 构造函数的特点能new 而且可以调用


// 类中的概念  实例的属性  实例共享属性  类来调用的 静态属性 (方法)

// 类中的this 默认不知道它自己具备的什么属性, ts 要做类型检测
class Pointer{
    x:number = 1;
    y:number = 2;  // 如果只添加类型 没有赋值，ts默认不能将null 赋值给其他类型
    constructor(x:number,y?:number){ // 构造函数和普通函数的参数一样可以支持可选参数、 默认参数 、剩余参数
        this.x = x;
        this.y = y!; // 考虑安全性  不能将大范围类型，赋予给小范围类型 （ts的兼容性）
        
        // 真正开发中使用 ! 和 as语法的场景是非常多的
    }
}
let r = new Pointer(100)


// 类的修饰符 java（public、protected、private、readonly）  限制访问的范文 
// public 就意味着公开 自己能访问 儿子能访问 外界能访问
// protected 自己能访问 儿子能访问  外界不能访问
// private  自能自己访问

// 构造函数也可以添加 修饰符， 除了public 之外的都不能直接new这个类
class Animal{
    public readonly type:string = '哺乳类'; // 仅读只能在初始化的时候修改 （只能在构造函数中修改，不能在其他地方修改）
    constructor(type:string){
        this.type = type
    }
    public getType(){
        return this.type
    }
    static flag = '动物'
    static getFlag(){
        console.log(this)
        return this.flag;
    }
    eat(){
        console.log('animal eat');
        return ''
    }
}
class Dog extends Animal{
    constructor(type:string){ // 如果子类写了constrctor 那么子类必须调用super
        super(type); // Animal.call(this);
    }
}
let animal = new Animal('xxx');
let dog = new Dog('xxx');
// dog.type = 'xxx'

// super 在构造函数和静态方法中 super指向父类
// super 在原型方法中指代的是父类的原型

// es6 中的静态属性、方法  类的访问器都可以在ts中使用
class Cat extends Animal{ // Cat.__proto__ = Animal
    // private name:string = ''
    constructor(type:string,private name:string){ //接受name 并直接声明到实例上
        super(type);
        // this.name = name;
    }
    static getFlag(){ // 子类要改写父类的静态方法 返回的值要兼容
        console.log(super.getFlag())
        return '猫'
    }
    get newName(){
        return this.name
    }
    set newName(newVal){ // 校验 和 属性的保护，防止非法篡改name
        this.name = newVal;
    }
    eat(){ // 子类重写的原型方法 要和父类的一致
        super.eat();
        console.log('猫 eat')
        return ''
    }
}
let cat = new Cat('哺乳类','Tom');

// Vue里面的 ref 就是用类来实现的, vue2 defineReactvie

console.log(cat.eat())
console.log(Cat.getFlag()) // 静态属性和静态方法 是可以被子类直接继承的


export {}