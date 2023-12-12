const data = {
  text: 'hello wrold',
  ok: true
}
let activeEffect
const bucket = new WeakMap()


function effect(fn) {
  const effectFn = () => {
    // 副作用函数执行之前， 将该函数从其所在的依赖集合中删除
    cleanup(effectFn)
    // 当 effectFn 执行时， 将其设置为当前激活的副作用函数
    activeEffect = effectFn
    fn()
  }
  effectFn.deps = [] // activeEffect.deps 用来存储所有与该副作用函数相关的依赖集合 >>>> 这里有点难懂，在自己身上加属性, 在 track 的时候通过 activeEffect.deps 拿到该属性
  effectFn()
}


function cleanup(effectFn) {
  for (let i = 0, len = effectFn.deps.length; i < len; i++) {
    let deps = effectFn.deps[i] // 依赖集合
    deps.delete(effectFn)
  }
  effectFn.deps.length = 0
}


 const obj = new Proxy(data, {
  get(target, p, receiver) {
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
  let deps = depsMap.get(key) // 根据 key 得到 depsSet(set 类型)，里面存放了该 target --> key 对应的副作用函数
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  deps.add(activeEffect) // 将副作用函数加进去
  // deps 就是当前副作用函数存在联系的依赖集合
  // 将其添加到 activeEffect.deps 数组中
  activeEffect.deps.push(deps)
}

function trigger(target, key) {
  const depsMap = bucket.get(target) // traget Map
  if (!depsMap) return
  const effects = depsMap.get(key) // effectFn set
  const effectToRun = new Set(effects)
  effectToRun && effectToRun.forEach(fn => {
    if (typeof fn === 'function') fn()
  })
}

effect(() => {
  console.log('effect run')
  console.log(obj.ok ? obj.text : 'no')
})

setTimeout(() => {
    obj.ok = false
}, 1000)

setTimeout(() => {
    console.log('setTimeout 2s ~~~')
    obj.text = 'ds'
}, 2000)
