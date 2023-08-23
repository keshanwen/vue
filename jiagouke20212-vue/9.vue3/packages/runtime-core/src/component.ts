import { hasOwn, isFunction, isObject, ShapeFlags } from "@vue/shared";

export function createComponentInstance(vnode){
    const instance = {
        vnode, // 组件的虚拟节点
        data:{},
        attrs:{}, // 去掉用户使用的props之后的结果 
        props:{xxx:1}, // 用户写的props
        slots:{},
        render:null,
        setupState:{},
        subTree:null , // 组件渲染的虚拟节点的结果  $vnode _vnode
        isMounted:false, // 组件是否挂载过
        bc:null,
        m:null,
        ctx:{},
        proxy:{},
        update:null
    }
    // vue2 中取 props,data？ 在哪里取出来的 this._data this._props
    instance.ctx = {_:instance}

    // new Proxy
    return instance;
}
const isStatefulComponent = (vnode)=>{
    return vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT
}
// vue2 无状态组件 就是没有data，只有属性和外界传过来的数据 

function createContext(instance){
    return {
        attrs:instance.attrs,// 用户传递的所有属性 ，不包含props
        slots: instance.slots, // 组件的插槽
        emit: ()=>{},// 用于发射最新的结果的 $emit
        expose:()=>{} // 如果用户使用了ref属性 放到了组件上，他默认拿到的是组件的实例，但是如果定义了expose，那么就拿到的是expose，不在是组件实例
    }
}
function finishComponentSetup(instance){
    const Component = instance.vnode.type;
    if(!instance.render){
        if(!Component.render && Component.template){ // vue2 中模板编译原理就是把template变成render函数
            // 把模板编译成render函数  -> compiler
        }
        instance.render = Component.render; // 组件的render挂载到实力上

        // render函数 就是用户写的render， 数据可以在 instance.proxy上取
    }
}
function handleSetupResult(instance,setupResult){
    if(isFunction(setupResult)){
        instance.render = setupResult
    }else if(isObject(setupResult)){
        instance.setupState = setupResult
    }
    finishComponentSetup(instance);
}

function setupStatefulComponent(instance){
     const Component = instance.vnode.type // 用户定义的对象，组件本身
     instance.proxy = new Proxy(instance.ctx,{
         get({_:instance},key){
            const {setupState,props,data} = instance;
            if(hasOwn(setupState,key)){
                return setupState[key]
            }else if(hasOwn(data,key)){
                return data[key]
            }else if(hasOwn(props,key)){
                return props[key]
            }
         },
         set({_:instance},key,value){
            const {setupState,props,data} = instance;
            if(hasOwn(setupState,key)){
                setupState[key] = value
            }else if(hasOwn(data,key)){
                 data[key] = value
            }else if(hasOwn(props,key)){
                 props[key] = value
            }
            return true;
         }
     })
     let {setup } = Component;
     if(setup){
        let ctx = createContext(instance);
        const setupResult = setup(instance.props,ctx);
        handleSetupResult(instance,setupResult);
     }else{
        finishComponentSetup(instance);
     }

}
export function setupComponent(instance){
    const {props,children} = instance.vnode;
    // initProps()
    // initSlot()
    const isStateful =  isStatefulComponent(instance.vnode) 
    const setupResult = isStateful ? setupStatefulComponent(instance):undefined; // 取setup的返回值
   

}
