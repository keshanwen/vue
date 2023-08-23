export function patchEvent(el, key, nextVal) { // onXXX
    const invokers = el._vei || (el._vei = {}); // 用来缓存绑定的事件
    const exists = invokers[key];
    if (exists && nextVal) { // el.addEventListener('click')
        exists.value = nextVal
    } else {
        const eventName = key.slice(2).toLowerCase();
        if (nextVal) {
            const fn = invokers[key] = createInvoker(nextVal);
            el.addEventListener(eventName,fn)
        } else {
            el.removeEventListener(eventName, exists); //移除函数
        }
    }
    // let fn = () =》{ fn.xxx()}
    // fn.xxx = preFn
    // el.addEventListenr(fn) 
    // fn.xxx = nextVal
}
function createInvoker(fn) {
    const invoker = (e) => { invoker.value(e) }
    invoker.value = fn;
    return invoker;
}