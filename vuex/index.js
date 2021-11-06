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
    this.options = options;
  }
}

export default {
  install,
  Store
}