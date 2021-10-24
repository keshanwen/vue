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
    Object.defineProperty(obj,key,{
      enumerable: true,
      configurable: true,
      get() {
        return val
      },
      set(newValue) {
        if (newValue === val) {
          return
        }
        val = newValue
        // 发送通知
      }
    })
  }
}