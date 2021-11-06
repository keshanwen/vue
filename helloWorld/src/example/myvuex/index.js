import Vue from 'vue'
/* 
install 方法会在外界调用Vue.use的时候执行
并且在执行的时候会把Vue实例和一些额外的参数传递给我们

*/

const install = (Vue,options) => {
  /* 给每一个vue实例都添加一个$store属性 */
  /* 
  在vue中有一个名称叫做mixin的方法，这个方法会在创建每一个vue实例的时候执行
  所以我们可以通过mixin方法给每一个vue实例添加$store属性
  
  */
  Vue.mixin({
    beforeCreate () {
      /* 
      vue在创建实例的时候会先创建父组件，然后在创建子组件

      root  >> app >> home

      如果是根组件，那么默认就有store
      我们只需要将store变成$store就可以
      
      */ 
      //console.log(this.$options.name,'......')
      if (this.$options && this.$options.store) {
        this.$store = this.$options.store;
      } else {
        /* 
          如果不是根组件，那么默认没有store
          我们只需要将他父组件的$store赋值给他就可以
        */
         this.$store = this.$parent.$store
      }

    }
  })
}

class Store {
  constructor(options) {
    //this.options = options;
    /* 
      将创建的store时需要共享的数据添加到store上面
      这样将来我们就能通过this.$store拿到这个store
      既然能拿到这个store，我们就可以通过.state拿到需要共享的属性
    */
    //  this.state = options.state
    /* 
    
    在vue中有一个util的工具类，这个工具类上有一个defineReactive方法
    通过这个方法就可以快速的将某个数据变成全向绑定的数据
    defineReactive这个方法接收三个参数
        第一个参数: 要给哪个对象添加属性
        第二个参数: 要给指定的对象添加什么属性
        第三个参数: 要给这个属性添加什么值
    */
    Vue.util.defineReactive(this, 'state', options.state);
     /* 
     将传递进来的getters放到store上
     */
    //this.getters = options.getters;
    this.initGetters(options)
    /* 将传递进来的mutations放到store上 */
    this.initMutations(options)
  }
  initGetters(options) {
    /* 
      1,拿到传递进来的getters
    */
    let getters = options.getters || {}
    /* 2,在store上新增一个getters属性 */
    this.getters = {}
    /* 3,将传递进来的getters中的方法添加到当前store的getters上 */
    for (let key in getters) {
     Object.defineProperty(this.getters,key,{
       get: () => {
         return getters[key](this.state)
       }
     })
    }
  }
  initMutations(options) {
    // 1,拿到传递进来的mutations
    let mutations = options.mutations || {}
    // 2,在store上新增一个mutations属性
    this.mutations = {}
    // 3,将传递进来的mutations中的方法添加到当前store的mutations上
    for (let key in mutations) {
      this.mutations[key] = (playload) => {
        mutations[key](this.state,playload)
      }
    }
  }
  commit(type,playload) {
    this.mutations[type](playload)
  }
}

export default {
  install,
  Store
}