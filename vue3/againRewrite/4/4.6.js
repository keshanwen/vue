const data = {
  foo: true,
  bar: true,
  num: 1
}

let activeEffect,
  effectStack = []
const bucket = new WeakMap()


function effect(fn) {
  const effectFn = () => {
    cleanup(effectFn)
    activeEffect = effectFn
    effectStack.push(activeEffect)
    fn()
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
  get(target,p, receiver) {
    track(target, p)
    return target[p]
  },
  set(target, p, value, receiver) {
    target[p] = value
    trigger(target, p)
    return true
  }
})

function track(target, key) {
  if (!activeEffect) return
  let depsMap = bucket.get(target)
  if (!depsMap) {
    bucket.set(target, depsMap = new Map())
  }
  let deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  deps.add(activeEffect)
  activeEffect.deps.push(deps)
}

function trigger(target, key) {
  const depsMap = bucket.get(target)
  if (!depsMap) return
  const effects = depsMap.get(key)
  const effectToRun = new Set()
  effects && effects.forEach(effectFn => {
    if (effectFn !== activeEffect) {
      effectToRun.add(effectFn)
    }
  })
  effectToRun && effectToRun.forEach(fn => {
    if (typeof fn === 'function') fn()
  })
}

// 写  -》 fn() 读 加到 num 的set 中，因为写了，要取出 num 的所有回调 =》 执行 fn() 写 =》 fn() 读 加到 num 的 set 中，因为写了， 要取出 num 的所有回调 =》 执行 fn() 写 =》

effect(() => {
    console.log(obj.num)
    obj.num = 24
})

setTimeout(() => {
  obj.num = 34
},2000)