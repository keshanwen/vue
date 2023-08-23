/* @flow */

import { mergeOptions } from '../util/index'

export function initMixin (Vue: GlobalAPI) {
  Vue.mixin = function (mixin: Object) {

    // 通过mergeOptions 合并选项
    this.options = mergeOptions(this.options, mixin)
    return this
  }
}
