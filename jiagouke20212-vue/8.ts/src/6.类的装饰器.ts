// 类的装饰器 语法糖 用来装饰类的

// 类的装饰器 可以装饰类本身 (参数就是类)  类的属性   类的方法  静态属性 类中函数的参数都可以使用

function addSay(target:Function){
    target.prototype.say = function(){
        console.log('say')
    }
}
function toUpper(isUpper:boolean){
    // target 是原型，  key是属于实例的
    return function (target:any,key:string) { // target 指的是类的原型 ，key是属性 
        let val = '';
        Object.defineProperty(target,key,{ // 原型增加属性
            get(){
                return isUpper?val.toUpperCase():val
            },
            set(newVal){
                val = newVal 
            }
        })
    }
}

function Enum(isEnum:boolean){
    return function(target:any,key:any,descriptor:PropertyDescriptor){
        descriptor.enumerable = isEnum
    }
}

@addSay // addSay(Animal)
class Animal{
    public say!:Function // 提示
    @toUpper(false)
    public name:string = 'jiangwen' // 是给实例赋值
    __proto__: any // 为了代码能得到提示而已

    get myname(){ // 如果想给原型添加属性 可以使用属性访问器
        return 'abc'
    }
    @Enum(false)
    public eat(){ // 原型上的？ 如何声明原型上的属性 

    }
}
let animal = new Animal;
console.log(animal); // 他会找对应的getter有没有, 如果都没找到就取自己的


// 因为这个是一个试验性语法 所以不建议使用，后序会更改，stage-3 react、mobx nest.js  可以不用就是一个语法糖
// ts 中对this的推断比较弱，所以尽量不要使用类 
export {};


