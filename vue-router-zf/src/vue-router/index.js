import install, { Vue } from './install'


class VueRouter {
  constructor(options = {}) {
    const routes = options.routes
    this.mode = options.mode || 'hash'
  }

  match() { }

  init() { }
}


VueRouter.install = install

export default VueRouter