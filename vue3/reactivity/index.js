const isObject = val => val !== null && typeof val === 'object'
const convert = target => isObject(target) ? reactive(target) : target
const hasOwnProperty = Object.prototype.hasOwnProperty
const hasOwn = (target, key) => hasOwnProperty.call(target, key)

let activeEffect = null
function effect(callback) {
  activeEffect = callback
  callback() // 访问响应式对象属性，去收集依赖
  activeEffect = null
}

let targetMap = new WeakMap()
function track(target,key) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target,( depsMap = new Map()))
  } 
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }
  dep.add(activeEffect)
} 

function trigger(target,key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  const dep = depsMap.get(key)
  if (dep) {
    dep.forEach(effect => {
      effect()
    });
  } 
}



function reactive (target) {
  if (!isObject(target)) return target

  const handler = {
    get (target, key, receiver) {
      // 收集依赖
      track(target,key)
      const result = Reflect.get(target,key,receiver)
      return convert(result)
    },
    set (target, key, value, receiver) {
      const oldValue = Reflect.get(target,key,receiver)
      let result = true
      if (oldValue !== value) {
        result = Reflect.set(target, key, value, receiver)
        // 触发更新
        trigger(target,key)
      }
      return result
    },
    deleteProperty (target, key) {
      const hadKey = hasOwn(target,key)
      const result = Reflect.deleteProperty(target,key)
      if (hadKey && result) {
        // 触发更新
        trigger(target,key)
      }
      return result
    }
  }
  
  return new Proxy(target,handler)
}

function ref(raw) {
  // 判断 raw 是不是 ref 创建的对象，如果是的话直接返回

  let value = convert(raw)
  const r = {
    __v_isRef: true,
    get value () {
      track(r,'value')
      return value
    },
    set value (newValue) {
      if (newValue !== value) {
        raw = newValue
        value = convert(raw)
        trigger(r,'value')
      }
    }
  }

  return r
}


