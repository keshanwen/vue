import install, { Vue } from './install'
import {createMatcher} from './create-matcher'

class VueRouter {
  constructor(options = {}) {
    const routes = options.routes
    this.mode = options.mode || 'hash'

    // 给我个路径 我就返回给你对应的记录
    // match 匹配方法
    // addRoutes 动态添加路由
    this.matcher = createMatcher(options.routes || [])
  }

  match() { }

  init(app) {

  }
}


VueRouter.install = install

export default VueRouter