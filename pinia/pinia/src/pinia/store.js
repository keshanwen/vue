// 这里存放 defineStore 的api
// createPinia() 默认是一个插件具备一个 install 方法
// _s 用来存储 id -> store
// state 用来存储所有状态的
// _e 用来停止所有状态的

// id + options
// options!pin
// id + setup
import { getCurrentInstance,inject, reactive, effectScope,computed } from 'vue'
import { piniaSymbol } from './rootStore'


function createSetupStore(id, setup, pinia) {
    let scope;
    // 后续一些不是用户定义的属性和方法，内置的api会增加到这个store上
    const store = reactive({}); // store就是一个响应式对象而已
    // 父亲可以停止所有 , setupStore 是用户传递的属性和方法
    const setupStore = pinia._e.run(() => {
        scope = effectScope(); // 自己可以停止自己
        return scope.run(() => setup())
    })
    function wrapAction(name, action) {
        return function () {
            let ret = action.apply(store, arguments);

            // action执行后可能是promise
            // todo ...

            return ret;
        }
    }
    for (let key in setupStore) {
        const prop = setupStore[key];
        if (typeof prop == 'function') { // 你是一个action
            // 对action中的this 和 后续的逻辑进行处理 ， 函数劫持
            setupStore[key] = wrapAction(key, prop)

        }
    }
    // pinia._e.stop(); // 停止全部
    // scope.stop() 值是停止自己
    pinia._s.set(id, store); // 将store 和 id映射起来
    Object.assign(store, setupStore)
    return store;
}

function createOptionsStore(id, options, pinia) {
    const { state, actions, getters } = options;
    function setup() { // 这里面会对用户传递的state，actions getters 做处理
        const localState = pinia.state.value[id] = state ? state() : {}
        // getters
        return Object.assign(
            localState, // 用户的状态
            actions, // 用户的动作
            Object.keys(getters || {}).reduce((memo, name) => {
                // 用户计算属性
                memo[name] = computed(() => {
                    let store = pinia._s.get(id);
                    return getters[name].call(store)
                })
                return memo;
            }, {})
        )
    }
    createSetupStore(id, setup, pinia)
}


export function defineStore(idOrOptions, setup) {
  let id;
  let options;

  if (typeof idOrOptions === 'string') {
    id = idOrOptions
    options = setup
  } else {
    options = idOrOptions
    id = idOrOptions.id
  }

  // 可能setup 是一个函数，
  const isSetupStore = typeof setup === 'function'

  function useStore() {
    // 在这里我们拿到的 store 应该是同一个
    let instance = getCurrentInstance()
    const pinia = instance && inject(piniaSymbol)

    if (!pinia._s.has(id)) { // 第一次 useStore
      if (isSetupStore) {
        createSetupStore(id, setup,pinia)
      } else {
        // 如果是第一次 则创建映射关系
        createOptionsStore(id, options, pinia)
      }
    }
    // 后续通过 id 获取对应的 store 返回
    const store = pinia._s.get(id)

    return store
  }

  return useStore // 用户最终拿到是这个 store
}