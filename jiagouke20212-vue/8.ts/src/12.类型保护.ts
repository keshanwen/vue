// 类型保护 （更好的去识别类型） js 本身就用类型识别功能 typeof instanceof in 
function getV(val: string | number) {
    if (typeof val == 'string') {
        val.split('')
    } else {
        val.toFixed()
    }
}
class Person { }
class Animal { }
function getV1(val: Person | Animal) { // 描述实例的
    if (val instanceof Person) {
        val
    } else {
        val
    }
}
// 根据是否包含某个属性来区分  Fish  游泳  Bird 飞
interface Fish {
    kind: '鱼',
    swiming: string
}
interface Bird {
    // fly: string
    kind: '鸟',
    swiming: string
}
function getV2(val: Fish | Bird) { // 描述实例的
    if ('swiming' in val) {
        val
    } else {
        val
    }
}
// ts里面也有自己的概念 可辨识的类型
function getV3(val: Fish | Bird) { // 描述实例的
    if (val.kind == '鱼') {
        val
    } else {
        val
    }
}
// vue3 里面有很多判断 是不是某个类型的

function isFish(x: Fish | Bird): x is Fish { // ts 语法 就是用来标识具体的返回类型
    return x.kind == '鱼'
}
function getV4(val: Fish | Bird) { // 描述实例的
    if (isFish(val)) { val } else { val }
}

// 完整性保护 漏掉了某些逻辑， 可能会导致报错

interface ISquare {
    kind: 'square',
    width: number
}
interface IRact {
    kind: 'rect',
    width: number
    height: number
}
interface ICircle {
    kind: 'circle',
    r: number
}

// ast 树解析的时候 <  文本 <!
function assert(obj: never) { }
function getArea(val: ISquare | IRact | ICircle) {
    switch (val.kind) {
        case 'square':
            val
            break;
        case 'rect':
            val
            break;
        case 'circle':
            val
            break;
        default:
            assert(val)
    }
}
// ts中的完整性保护

export { }