import { patchAttr } from "./modules/attr";
import { patchClass } from "./modules/class";
import { patchEvent } from "./modules/event";
import { patchStyle } from "./modules/style";


export const patchProp = (el, key, prevVal, nextVal) => {
    switch (key) {
        case 'class': // dom操作 el.className
            patchClass(el,nextVal)
            break;
        case 'style': // el.style.background
            patchStyle(el, prevVal, nextVal); // 样式要比对前囧
            break;
        default:
            if (/^on[a-z]/.test(key)) { // el.addEventListener
                patchEvent(el,key,nextVal)
            } else { // el.setAttribute
                patchAttr(el,key,nextVal)
            }
    }
}