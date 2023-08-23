import Vue from 'vue'
import App from './App.vue'

new Vue({
    render: h => h(App),
}).$mount('#app')



// 不停的向上查找父亲，调用父亲的事件即可
Vue.prototype.$dispatch = function(componentName, eventName, val) {
    let parent = this.$parent; // 父组件

    while (parent) {
        if (componentName === parent.$options.name) {
            break;
        }
        parent = parent.$parent;
    }

    if(parent){ // 找到父亲 触发对应的事件
      parent.$emit(eventName,val)
    }
}

Vue.prototype.$broadcast = function (componentName) {
    let childrenList = [];
    function findChildren(children){
      children.forEach(child=>{
        if(child.$options.name === componentName){
          childrenList.push(child);
        }
        if(child.$children){ // 一直查找孩子
          findChildren(child.$children)
        }
      })
    }
    findChildren(this.$children);
    return childrenList
}