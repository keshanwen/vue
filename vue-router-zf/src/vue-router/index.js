import install, { Vue } from './install'
import {createMatcher} from './create-matcher'
import Hash from './history/hash'
import HTML5History from './history/h5'

class VueRouter {
  constructor(options = {}) {
    const routes = options.routes
    this.mode = options.mode || 'hash'

    // 给我个路径 我就返回给你对应的记录
    // match 匹配方法
    // addRoutes 动态添加路由
    this.matcher = createMatcher(options.routes || [])

    /*
      根据模式需要初始化不同的路由系统 hash/history 底层实现不一样， 但是使用方式是一样的

      hash => hash.js => push
      history => history.js => push
      base
    */

    // 每次跳转 我需要获取当前的路径 this.$router.pathname
    switch (this.mode) {
      case 'hash':
        this.history = new Hash(this)
        break
      case 'history':
        this.history = new HTML5History(this)
        break;
    }
  }

  match(location) {
    return this.matcher.match(location)
  }

  init(app) {
    const history = this.history // 当前管理路由的
    /*
      hash  =>  hashChange 但是浏览器支持 popstate 就优先采用 popstate
      history => popState 性能高于 hashchange 但是有兼容问题

      页面初始化完毕后 需要先进行一次跳转

    */

    // 跳转到某个路径
    const setUpListener = () => {
      history.setUpListener()
    }

    history.transitionTo(
      history.getCurrentLocation(), // 各自的获取路径方法
      setUpListener
    )
  }
}


VueRouter.install = install

export default VueRouter