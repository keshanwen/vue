export function patchAttr(el,key,nextVal){
    if(nextVal == null){
        el.removeAttribute(key);
    }else{
        el.setAttribute(key,nextVal);
    }
}