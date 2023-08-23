export function patchStyle(el, prevVal, nextVal){
    const style = el.style; // 元素的样式 
    if(nextVal == null){
        el.removeAttribute('style')
    }else{
        if(prevVal){ // 之前有现在没有了 需要移除 
            for(let key in prevVal){
                 if(nextVal[key] == null){
                     style[key] = ''; // 样式给空就清除掉了
                 }
            }
        }
        for(let key in nextVal){
            style[key] = nextVal[key];
        }
    }
}