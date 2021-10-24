class Vue {
  constructor(options) {
    // 1, 通过属性保存选项的数据
    this.$options = options || {}
    this.$data = options.data || {}
    this.$el = typeof options.el === 'string' ? document.querySelector(options.el) : options.el
    // 2，把data中的成员转换成getter和setter，注入到vue实例中
    this._proxyData(this.$data)
    // 3, 调用observer对象，监听数据变化
    // 4，调用complier对象，解析指令和差值表达式
  }
  // 将data中的属性，代理到this中
  _proxyData(data) {
    // 遍历data中的所有属性
    Object.keys(data).forEach( key => {
      // 把data中的属性注入到vue实例中
      Object.defineProperty(this,key,{
        enumerable: true,
        configurable: true,
        get() {
          return data[key]
        },
        set(newValue) {
          if (newValue === data[key]) {
            return
          }
          data[key] = newValue
        }
      })
    })
  }
}