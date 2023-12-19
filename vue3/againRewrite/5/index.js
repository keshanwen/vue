let activeEffect,
  effectStack = []
jobQueue = new Set()

const bucket = new WeakMap()
const p = Promise.resolve()
const ITERATE_KEY = Symbol('iterate key')

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


function trigger(target, key, type) {
  const depsMap = bucket.get(target)
  if (!depsMap) return
  const effects = depsMap.get(key)
  const iterateEffects = depsMap.get(ITERATE_KEY)

  const effectToRun = new Set()
  effects && effects.forEach(effectFn => {
    if (effectFn !== activeEffect) {
      effectToRun.add(effectFn)
    }
  })

  // 如果操作是添加操作， 才将iterate_key 相关联的副作用函数取出执行
  if (type === 'ADD' || type === 'DELETE') {
    iterateEffects && iterateEffects.forEach(fn => {
      if (fn !== activeEffect) {
        effectToRun.add(fn)
      }
    })
  }

  effectToRun && effectToRun.forEach(fn => {
    if (fn.options.scheduler) {
      fn.options.scheduler(fn)
    } else {
      fn()
    }
  })
}

/* const data = {
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
 */

const data = {
  foo: 1,
  bar: 2
}

function reactive(obj) {
  return new Proxy(obj, {
    get(target, p, receiver) {
      if (p === 'raw') {
        return target
      }
      track(target, p)
      return Reflect.get(...arguments)
    },
    set(target,p,value, receiver) {
      const oldValue = target[p]
      const type = Object.prototype.hasOwnProperty.call(target, p) ? 'SET' : 'ADD'
      const res = Reflect.set(...arguments)
      if (receiver.raw === target) { // receiver 是被代理对象 target的 proxy, 才继续更新
        if (oldValue !== value && (!Number.isNaN(oldValue) || !Number.isNaN(value))) {
          trigger(target,p,type)
        }
      }
      return res
    },
    has(target,p) {
      track(target, p)
      return Reflect.has(target,p)
    },
    ownKeys(target) {
      track(target, ITERATE_KEY)
      return Reflect.ownKeys(target)
    },
    deleteProperty(target,p) {
      const hasKey = Object.prototype.hasOwnProperty.call(target, p)
      const res = Reflect.deleteProperty(target, p)
      if (hasKey && res) {
        trigger(target,p, 'DELETE')
      }
      return res
    }
  })
}

const obj = {}
proto = { bar: 1 }
child = reactive(obj)
parent = reactive(proto)

Object.setPrototypeOf(child, parent)

effect(() => {
  console.log('effect ~~~~')
  console.log(child.bar)
})

child.bar++