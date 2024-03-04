// 存的是 createPinia 这个
import { ref, effectScope } from 'vue'
import { piniaSymbol } from './rootStore'

export function createPinia() {
  const scope = effectScope()
  const state = scope.run(() => ref({})) // 用来存储每个store的state 的
  // scope.stop() 可以通过一个方法全部停止响应

  // 状态里面可能会存放 计算属性， computed

  const pinia = {
    _s: new Map(), // 这里用这个map来存放所有的 store { counter1 -> store, counter2 -> store }
    _e: scope,
    install(app) {
      // 对于pinia而言，我们希望让它去管理所有的 store
      // pinia 要去收集所有的 store 的信息， 过一会想卸载 store
      // 如何让所有的store 都能获取这个pinia 对象
      app.provide(piniaSymbol, pinia)
      // this.$pinia
      app.config.globalProperties.$pinia = pinia // 让 vue2 的组件实例也可以共享
    },
    state,
  }

  return pinia
}