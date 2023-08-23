<template>
    <div>
        <!-- input内容的 -->
        <slot></slot>
    </div>
</template>
<script>
export default {
    name:'ElFormItem',
    props:{
        prop:String
    },
    inject:['elForm'], // vm.elForm
    mounted(){
        this.$on('changeInput',(val)=>{
            this.validate(val);
        })
    },
    methods:{
        validate(val){
            // async-validator  用这个包来校验是否符合要求
            console.log(this.elForm.rules[this.prop], val)
            return false;
        }
    }
}
</script>
