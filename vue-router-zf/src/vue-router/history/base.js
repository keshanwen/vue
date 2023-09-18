

function createRoute(record, location) { // 创建路由
  const matched = []
  // 不停的去父级查找
  if (record) {
    while (record) {
      matched.unshift(record)
      record = record.parent;
    } // /about/a   =>  [about, aboutA]
  }

  return {
    ...location,
    matched
  }
}

export default class History {
  constructor(router) {
    this.router = router
    // 保存路径的变化
    // 当前没有匹配到记录
    this.current = createRoute(null, {
      path: '/'
    }) // { path: '/', matched: [] }
  }

  transitionTo(path, cb) {
    // 前端路由的实现原理 离不开hash h5
    let record = this.router.match(path)
    this.current = createRoute(record, { path })
    /*
      路径变化 需要渲染组件 响应式原理
      我们需要将 current 属性变成响应式的，这样后续更改 current 就可以渲染组件了
      Vue.util.defineReactive() === defineReactive

      我可以在 router-view 组件中使用 current 属性，如果路径变化就可以更新 router-view 了
    */
    cb && cb() // 默认第一次cb 是 hashchange
  }
}