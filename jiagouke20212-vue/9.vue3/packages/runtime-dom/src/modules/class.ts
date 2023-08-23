export function patchClass(el,nextVal){
    if(nextVal == null){
        nextVal = '';
    }
    el.className = nextVal
}