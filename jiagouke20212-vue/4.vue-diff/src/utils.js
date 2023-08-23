export function isFunction(val){
    return typeof val == 'function'
}
export function isObject(val){
    return typeof val == 'object' && val !== null;
}


let callbacks = [];
let waiting = false;
function flushCallbacks(){
    callbacks.forEach(fn=> fn()); // 按照顺序清空nextTick
    callbacks = [];
    waiting = false;
}
export function nextTick(fn){ // vue3 里面的nextTick 就是promise ， vue2里面做了一些兼容性处理
    callbacks.push(fn);
    if(!waiting){
        Promise.resolve().then(flushCallbacks);
        waiting = true
    }
}



export let isArray = Array.isArray

let strats = {}; 


let lifeCycle = [
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted'
];
lifeCycle.forEach(hook => {
    strats[hook] = function (parentVal,childVal) {
        if(childVal){
            if(parentVal){ 
                return parentVal.concat(childVal)
            }else{ // 儿子有值 父亲没有值
                if(isArray(childVal)){
                    return childVal
                }else{
                    return [childVal]
                }
            }
        }else{
            return parentVal;
        }
    }
});

export  function mergeOptions(parentVal,childVal){
    const options = {}
    for(let key in parentVal){
        mergeFiled(key);
    }
    for(let key in childVal){
        if(!parentVal.hasOwnProperty(key)){
            mergeFiled(key);
        }
    }
    function mergeFiled(key){
        let strat = strats[key];
        if(strat){
            options[key] =  strat(parentVal[key],childVal[key]); 
        }else{
            options[key] = childVal[key] || parentVal[key];
        }
    }
    return options;
}
