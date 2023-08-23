import { isArray, isObject } from "@vue/shared";
import { createVnode } from "./vnode";

export function h(type, propsOrChildren, children) {
    //  2 3 多个
    let l = arguments.length;
    if (l == 2) {
        // 1.类型 + 属性 
        if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
            return createVnode(type, propsOrChildren)
        } else {
            // 第二个参数是一个数组 
            return createVnode(type, null, propsOrChildren)
        }
    } else {
        if (l == 3) {
            return createVnode(type, propsOrChildren, children)
        } else if (l > 3) {
            return createVnode(type, propsOrChildren, Array.from(arguments).slice(2))
        }
    }

}