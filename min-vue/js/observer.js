class Observer {
  constructor(data) {
    this.walk(data)
  }

  walk(data) {
    // 1, 判断data是否是对象
    if (!data || typeof data !== 'object') {
      return
    }
    // 2， 遍历data对象的所有属性
    Object.keys(data).forEach( key => {
      this.defineReactive(data,key,data[key])
    })
  }
  // 思考？这里为什么要传入val,obj[key]不就可以拿到值了吗？
  defineReactive(obj,key,val) {
    const that = this
    // 如果val是对象,把val内部的属性转换成响应式数据
    this.walk(val)
    Object.defineProperty(obj,key,{
      enumerable: true,
      configurable: true,
      get() {
        return val
       // return obj[key] 因为会发生死递归，循环引用了.
      },
      set(newValue) {
        if (newValue === val) {
          return
        }
        val = newValue
        that.walk(newValue)
        // 发送通知
      }
    })
  }
}