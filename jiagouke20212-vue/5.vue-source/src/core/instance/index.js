import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) { // Vue的构造函数
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options) // 这里会调用初始化方法
}

initMixin(Vue) // Vue.prototype._init
stateMixin(Vue) // $data $props $set $delete $watch
eventsMixin(Vue) // $on $once $off $emit
lifecycleMixin(Vue) // Vue.prototype._update   Vue.prototype.$forceUpdate  $destroy
renderMixin(Vue) //  Vue.prototype._render

export default Vue
