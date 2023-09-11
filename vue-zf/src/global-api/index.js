import { mergeOptions } from "../utils"

export function initGlobalApi(Vue) {
  Vue.options = {} // 用来存放全局的配置 , 每个组件初始化的时候都会和options选项进行合并

  Vue.mixin = function (options) {
    this.options = mergeOptions(this.options, options)
    return this
  }

  Vue.options._base = Vue // 无论后续创建多少个子类 都可以通过_base 找到 Vue

}