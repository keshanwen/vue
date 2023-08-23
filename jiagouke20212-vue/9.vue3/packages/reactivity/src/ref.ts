import { hasChanged, isArray, isObject } from "@vue/shared/src";
import { track, trigger } from "./effect";
import { reactive } from "./reactive";


export function ref(value) {
    return createRef(value);
}

export function shallowRef(value) {
    return createRef(value, true);
}
const convert = val => isObject(val) ? reactive(val) : val;

class RefImpl {
    private _value;
    constructor(private rawValue, public isShallow) {
        this._value = isShallow ? rawValue : convert(rawValue) // this._value 就是一个私有属性 
    }
    // 这两个方法 会被转化成defineProperty
    get value() {
        track(this, 'get', 'value')
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(newValue, this.rawValue)) {
            this.rawValue = newValue; // 说明属性变化 需要更新
            this._value = this.isShallow ? newValue : convert(newValue)
            trigger(this, 'value', newValue, 'set');
        }

    }
}
function createRef(value, isShallow = false) {
    return new RefImpl(value, isShallow)

}
class ObjectRefImpl{ // vue2 proxy 是一样的
    constructor(public target,public key){}
    get value(){
        return this.target[this.key];
    }
    set value(newValue){
        this.target[this.key] = newValue;
    }
}

// promisefy
// promisifyAll
export function toRefs(object){
    // 对象的浅拷贝 
    const ret = isArray(object)? new Array(object.length) : {};
    for(let key in object){
        ret[key] = toRef(object,key);
    }
    return ret;
}


export function toRef(target,key){ // 就是取出某个属性变成ref
    return new ObjectRefImpl(target,key)
}


// 模板渲染的时候 会去判断是不是ref 如果是ref  就直接.value