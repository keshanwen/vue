let activeEffect,
  effectStack = []
jobQueue = new Set()

const bucket = new WeakMap()
const p = Promise.resolve()

let isFlushing = false
function flusJob() {
  if (isFlushing) return
  isFlushing = true
  p.then(() => {
    jobQueue.forEach(effectFn => effectFn())
  }).finally(() => {
    isFlushing = false
  })
}


function effect(fn, options = {}) {
  const effectFn = () => {
    cleanup(effectFn)
    activeEffect = effectFn
    effectStack.push(activeEffect)
    const res = fn()
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
    return res
  }
  effectFn.deps = []
  effectFn.options = options
  if (options.lazy) {
    return effectFn
  } else {
    effectFn()
  }
 }

function cleanup(effectFn) {
  for (let i = 0, len = effectFn.deps.length; i < len; i++) {
    let deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  effectFn.deps.length = 0
}


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
    if (fn.options.scheduler) {
      fn.options.scheduler(fn)
    } else {
      fn()
    }
  })
}

const data = {
  foo: 1,
  get bar() {
    // console.log(this === data, 'this~~~~~~~~~~~')
    // console.log(this === obj, 'this!!!!!!!!!!!!')
    return this.foo
  },
  set bar(v) {
    this.foo += v
  }
}

const obj = new Proxy(data, {
  get(target, p, receiver) {
    /*
      可以理解 receiver 为当前调用的 proxy 实列。Reflect.get(target,p,receiver)
      将当前proxy 实列传递下去， 在 Reflect 的参数 receiver 可以简单理解为 this 指向
     */
    track(target, p)
    return Reflect.get(...arguments)
  },
  set(target,p,value,receiver) {
    Reflect.set(...arguments)
    trigger(target, p)
    return true
  }
})

effect(() => {
  console.log('effect!!')
  console.log(obj.bar)
})

obj.foo++