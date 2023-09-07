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

export function nextTick(fn) {
    callbacks.push(fn)
    if (!waiting) {
        Promise.resolve().then(flushCallbacks)
        waiting = true
    }
}