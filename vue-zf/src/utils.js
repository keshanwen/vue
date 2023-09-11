
export function isFunction(val){
    return typeof val == 'function'
}
export function isObject(val){
    return typeof val == 'object' && val !== null;
}
export let isArray = Array.isArray

let callbacks = []
let waiting = false
function flushCallbacks() {
    callbacks.forEach(fn => fn())
    callbacks = []
    waiting = false
}

// 微任务是在页面渲染前执行 我取的是内存中的dom, 不关心你渲染完毕没有
export function nextTick(fn) {
    callbacks.push(fn)
    if (!waiting) {
        Promise.resolve().then(flushCallbacks)
        waiting = true
    }
}


let lifeCycleHooks = [
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted',
    'beforeUpdate',
    'updated',
    'beforeDestroy',
    'destroyed',
]

let strats = {}

function mergeHook(parentVal, childVal) {
    if (childVal) {
        if (parentVal) {
            return parentVal.concat(childVal)
        } else {
            return [childVal]
        }
    } else {
        return parentVal
    }
}

lifeCycleHooks.forEach(hook => {
    strats[hook] = mergeHook
})

strats.components = function (parentVal, childVal) {
    // Vue.options.components
    let options = Object.create(parentVal) // 根据父对象构造一个新对象 options._proto_ = parentVal
    if (childVal) {
        for (let key in childVal) {
            options[key] = childVal[key]
        }
    }
    return options
}

export function mergeOptions(parent, child) {
    const options = {}
    for (let key in parent) {
        mergeField(key)
    }
    for (let key in child) {
        if (parent.hasOwnProperty(key)) {
            continue
        }
        mergeField(key)
    }

    function mergeField(key) {
        const parentVal = parent[key]
        const childVal = child[key]

        if (strats[key]) {
            options[key] = strats[key](parentVal, childVal)
        } else {
            if (isObject(parentVal) && isObject(childVal)) {
                options[key] = { ...parentVal, ...childVal }
            } else {
                options[key] = child[key] || parent[key]
            }
        }
    }

    return options
}

export function isReservedTag(str) {
    let reservedTag = 'a,div,span,p,img,button,ul,li';
    return reservedTag.includes(str)
}