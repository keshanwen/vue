/* @flow */

import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import { ASSET_TYPES } from 'shared/constants'
import builtInComponents from '../components/index'
import { observe } from 'core/observer/index'

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'

export function initGlobalAPI (Vue: GlobalAPI) {
  // config
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef) // Vue.config

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  Vue.util = {  // 尽量不使用
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  Vue.set = set // 给不存在的属性 添加成响应式 vm.$set({},'a',100)
  Vue.delete = del
  Vue.nextTick = nextTick // 用一个异步(同步执行完毕后才执行)任务，将多个方法维持一个队列里 

  // 2.6 explicit observable API
  Vue.observable = <T>(obj: T): T => { // 小型的vuex  把对象变成响应式的
    observe(obj)
    return obj
  }

  Vue.options = Object.create(null) // </T>
  ASSET_TYPES.forEach(type => { // Vue.components = {} Vue.directives = {} Vue.filters = {}
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue  // 在任何地方 访问 _base 就是Vue的构造函数  


  // Vue.component
  // vue中实例上的变量一般都是以$开头  vm.$watch vm.$nextTick vm.$set vm.$attrs vm.$atters
  // vue的私有方法 vm.$$xxx
  extend(Vue.options.components, builtInComponents) // 增加keep-alive组件

  initUse(Vue) // Vue.use
  initMixin(Vue) // 将属性合并到Vue的选项上
  initExtend(Vue) // Vue.extend
  initAssetRegisters(Vue) // Vue.component Vue.directive Vue.filters
}
