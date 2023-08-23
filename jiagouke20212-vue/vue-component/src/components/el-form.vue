<template>
  <form @submit.prevent>
    <slot></slot>
  </form>
</template>

<script>
export default {
    name:'ElForm',
    props:{
        rules:Object,
        model:Object
    },
    methods:{
        validate(fn){
            fn(this.$broadcast('ElFormItem').every(item=>item.validate()))
        }
    },
    mounted(){
        // 获取所有的子组件 名字叫ElFormItem
        // let flag =


    },
    provide(){
        return {elForm:this}
    }
}
</script>