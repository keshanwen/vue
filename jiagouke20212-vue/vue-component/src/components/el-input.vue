<template>
  <div>
    <!-- 子组件不能直接修改父组件的数据 -->

    <!-- 组件的v-model  和 普通元素上v-model有什么区别 -->
    <input type="text" v-model="computedVal" />
  </div>
</template>

<script>
export default {
  props: {
    value: String
  },
  computed: {
    computedVal: { // defineProperty
      get() {
        return this.value
      },
      set(newVal) {
        this.$emit('input', newVal)
        // 通知父组件叫ElFormItem这个的组件，触发changeInput事件 值时newVal
        this.$dispatch('ElFormItem','changeInput', newVal);
      }
    }
  }
}
</script>