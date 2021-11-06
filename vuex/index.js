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
     this.state = options.state
     /* 
     将传递进来的getters放到store上
     */
    //this.getters = options.getters;
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
}

export default {
  install,
  Store
}