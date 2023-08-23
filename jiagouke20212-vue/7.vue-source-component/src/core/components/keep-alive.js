/* @flow */

import { isRegExp, remove } from 'shared/util'
import { getFirstComponentChild } from 'core/vdom/helpers/index'

type CacheEntry = {
  name: ?string;
  tag: ?string;
  componentInstance: Component;
};

type CacheEntryMap = { [key: string]: ?CacheEntry };

function getComponentName (opts: ?VNodeComponentOptions): ?string {
  return opts && (opts.Ctor.options.name || opts.tag)
}

function matches (pattern: string | RegExp | Array<string>, name: string): boolean {
  if (Array.isArray(pattern)) {
    return pattern.indexOf(name) > -1
  } else if (typeof pattern === 'string') {
    return pattern.split(',').indexOf(name) > -1
  } else if (isRegExp(pattern)) {
    return pattern.test(name)
  }
  /* istanbul ignore next */
  return false
}

function pruneCache (keepAliveInstance: any, filter: Function) {
  const { cache, keys, _vnode } = keepAliveInstance
  for (const key in cache) {
    const entry: ?CacheEntry = cache[key]
    if (entry) {
      const name: ?string = entry.name
      if (name && !filter(name)) {
        pruneCacheEntry(cache, key, keys, _vnode)
      }
    }
  }
}

function pruneCacheEntry (
  cache: CacheEntryMap,
  key: string,
  keys: Array<string>,
  current?: VNode
) {
  const entry: ?CacheEntry = cache[key]
  if (entry && (!current || entry.tag !== current.tag)) {
    entry.componentInstance.$destroy()
  }
  cache[key] = null
  remove(keys, key) // 删除头部
}

const patternTypes: Array<Function> = [String, RegExp, Array]

{/* <keep-alive :include="whiteList" :exclude="blackList" max="3">
  <router-view></router-view>
</keep-alive> */}

// 这个组件就是一个虚拟组件，不会被记录到父子关系中
export default {
  name: 'keep-alive',
  abstract: true, // 抽向组件

  props: {
    include: patternTypes, // 白名单  ['a','b']  c
    exclude: patternTypes, // 黑名单
    max: [String, Number] // 最大缓存数量  超过后删除以前的 增加最新的
  },

  methods: {
    cacheVNode() {
      //     {}      []     vnode组件的    组件的key
      const { cache, keys, vnodeToCache, keyToCache } = this
      if (vnodeToCache) {
        const { tag, componentInstance, componentOptions } = vnodeToCache
        cache[keyToCache] = { // 缓存中存放了 {组件的key : 组件的实例}
          name: getComponentName(componentOptions),
          tag,
          componentInstance,
        }
        keys.push(keyToCache)
        // prune oldest entry
        if (this.max && keys.length > parseInt(this.max)) {
          // 如果超过最大限制  需要删除第一个， 在增加最新的 LRU
          pruneCacheEntry(cache, keys[0], keys, this._vnode)
        }
        this.vnodeToCache = null
      }
    }
  },

  created () {
    this.cache = Object.create(null) // 创造一个对象来缓存组件
    this.keys = [] // 需要缓存的是谁
  },

  destroyed () {
    for (const key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys)
    }
  },

  mounted () {
    this.cacheVNode()  // 缓存虚拟节点
    this.$watch('include', val => { // watchApi 监控include 和 exlude做缓存处理
      pruneCache(this, name => matches(val, name))
    })
    this.$watch('exclude', val => {
      pruneCache(this, name => !matches(val, name))
    })
  },

  updated () {
    this.cacheVNode()
  },
  
  render () {
    const slot = this.$slots.default // 获取keep-alive 中的所有子组件
    const vnode: VNode = getFirstComponentChild(slot) // 获取插槽中的第一个
    const componentOptions: ?VNodeComponentOptions = vnode && vnode.componentOptions
    if (componentOptions) {  // {Ctor,tag,props,listeners}
      // check pattern
      const name: ?string = getComponentName(componentOptions) // 获取组件的名字
      const { include, exclude } = this

      // 要不要缓存，如果不用缓存 keep-alive 没有意义了
      if (
        // not included  //获取组件名 看一下是否需要缓存，如果不需要缓存 或者 没有排除直接return
        (include && (!name || !matches(include, name))) ||
        // excluded
        (exclude && name && matches(exclude, name))
      ) {
        return vnode
      }
      const { cache, keys } = this
      const key: ?string = vnode.key == null
        // same constructor may get registered as different local components
        // so cid alone is not enough (#3269)
        ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
        : vnode.key // 拿到组件的key 进行缓存，生成一个名字用来做缓存
      if (cache[key]) { // 如果有缓存  获取缓存的实例
        vnode.componentInstance = cache[key].componentInstance // vnode.componentInstance.el
        // make current key freshest
        remove(keys, key) // 找到已经有的删除掉
        keys.push(key) // 在新增一个
      } else {
        // delay setting the cache until update
        this.vnodeToCache = vnode // 我要缓存这个vnode
        this.keyToCache = key // 这个组件的key是多少
      }
      // <A keeyAlive=true></A>
      vnode.data.keepAlive = true // 第一次渲染完毕后，会把虚拟节点进行标记
    }
    return vnode || (slot && slot[0]) // 直接返回一个组件，keep-alive中只会返回一个组件
  }
}

// 1.就是取当前keep-alive中的第一个组件，拿到后把组件的实例缓存起来 ，如果超过限制会删除第一个
// 2.页面切换更新时 会走keep-alive的对比，(此时有keepAlive标记)就不会走初始化流程， 对比的时候会去比较 keep-alive中的插槽内容 （keep-alive 最终渲染的结果就是第一个子组件） 