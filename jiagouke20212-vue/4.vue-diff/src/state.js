import { observe } from "./observe"; // rollup-plugin-node-resolve
import { isFunction } from "./utils";

export function initState(vm){
    const opts = vm.$options;

    if(opts.data){
        initData(vm);
    }

}
function proxy(vm,key,source){ 
    Object.defineProperty(vm,key,{
        get(){
            return vm[source][key]; 
        },
        set(newValue){ 
            vm[source][key] = newValue; 
        }
    })
}
function initData(vm){
    let data = vm.$options.data; 
    data = vm._data =  isFunction(data) ? data.call(vm) : data;
    observe(data); 



    for(let key in data){ 
        proxy(vm,key,'_data');
    }
}

