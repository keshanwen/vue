import { createRouteMap } from './create-route-map'

export function createMatcher(routes) {

  // 路径和记录匹配 / record
  let { pathMap } = createRouteMap(routes)

  function match(path) {
    // 帮你去找 pathMap 中对应的记录
    return pathMap[path]
  }

  // 动态路由的实现 就是将新的路由插入到老的路由的映射表中
  function addRoutes(routes) {
    createRouteMap(routes, pathMap)
  }

  return {
    addRoutes,
    match
  }
}