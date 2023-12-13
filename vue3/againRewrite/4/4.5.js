const data = {
  foo: true,
  bar: true
}

let activeEffect,
  effectStack = []
const bucket = new WeakMap()

function effect(fn) {
  const effectFn = () => {
    cleanup(effectFn)
    activeEffect = effectFn
    effectStack.push(activeEffect) // 将当前副作用函数推进栈
    fn()
    /*
      当前副作用函数结束后， 将此函数推出栈顶， 并将 activeEffect 指向栈顶的副作用函数
      这样： 响应式数据就只会收集读取其值的副作用函数作为依赖
    */
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
  }
  effectFn.deps = []
  effectFn()
}


function cleanup(effectFn) {
  for (let i = 0, len = effectFn.deps.length; i < len; i++) {
    let deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  effectFn.deps.length = 0
}

const obj = new Proxy(data, {
  get(target,p,receiver) {
    track(target, p)
    return target[p]
  },
  set(target,p,value,receiver) {
    target[p] = value
    trigger(target, p)
    return true
  }
})

function track(target, key) {
  if (!activeEffect) return
  let dpesMap = bucket.get(target)
  if (!dpesMap) {
    bucket.set(target, dpesMap = new Map())
  }
  let deps = dpesMap.get(key)
  if (!deps) {
    dpesMap.set(key, (deps = new Set()))
  }
  deps.add(activeEffect)
  /*
    deps 就是当前副作用函数存在联系的依赖集合
    将其添加到 activeEffect.deps 数组中
  */
  activeEffect.deps.push(deps)
}

function trigger(target, key) {
  let depsMap = bucket.get(target)
  if (!depsMap) return
  const effects = depsMap.get(key)
  const efefctToRun = new Set(effects)
  efefctToRun && efefctToRun.forEach(fn => {
    if (typeof fn === 'function') fn()
  })
}

let tmp1, tmp2

effect(() => {
  console.log('effect1')
  effect(() => {
    console.log('effect2')
    tmp1 = obj.bar
  })
  tmp2 = obj.foo
})

setTimeout(() => {
  obj.foo = false
},1000)

// setTimeout(() => {
//   obj.bar = false
// },2000)

// obj.foo = false
// obj.foo = false
// obj.bar = false
// obj.bar = false
// obj.bar = false