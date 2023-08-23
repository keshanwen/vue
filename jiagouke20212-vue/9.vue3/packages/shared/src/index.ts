export const isObject = (val) => typeof val == 'object' && val !== null;
export const isNumber = (val) => typeof val == 'number';
export const isFunction = (val) => typeof val == 'function'
export const isString = (val) => typeof val == 'string'
export const isBoolean = (val) =>  typeof val == 'boolean';
export const isArray =  Array.isArray;
export const extend = Object.assign;


// 判断属性是不是原型属性 
export const hasOwn = (target,key) => Object.prototype.hasOwnProperty.call(target,key);
export const hasChanged = (oldValue,value) => oldValue !== value

export const isInteger = (key) => parseInt(key) + '' === key; // '3'  arr.xxx



export const enum ShapeFlags {
    ELEMENT = 1, // 1元素
    FUNCTIONAL_COMPONENT = 1 << 1, // 函数式组件 2 
    STATEFUL_COMPONENT = 1 << 2, // 带状态的组件 4 
    TEXT_CHILDREN = 1 << 3, // 内容是文本还 8 
    ARRAY_CHILDREN = 1 << 4, // 内容是数组孩子 16
    SLOTS_CHILDREN = 1 << 5,
    TELEPORT = 1 << 6,
    SUSPENSE = 1 << 7,
    COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
    COMPONENT_KEPT_ALIVE = 1 << 9,
    COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT
  }
  

  // +=   LET XXX = A+B
  // |=   LET XXX = A | B