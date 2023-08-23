<template>
  <div v-click-outside="handleBlur" style="display:inline-flex;flex-direction:column">
    <input type="text" @focus="handleFocus" />
    <div class="box" v-show="isShow">面板</div>
  </div>
</template>
<script>
export default {
  data() {
    return { isShow: false }
  },
  directives: {
    clickOutside: {
      bind(el, dirs, vnode) {
        const handler = (e) => {
          if (!el.contains(e.target)) {
            vnode.context[dirs.expression](e)
          }
        }
        el.handler = handler
        document.addEventListener('click', handler)
      },
      unbind(el){
          document.removeEventListener('click', el.handler)
      }
    }
  },
  methods: {
    handleFocus() {
      this.isShow = true
    },
    handleBlur() {
      this.isShow = false
    }
  }
}
</script>
<style scoped lang="scss">
.box {
  width: 150px;
  height: 100px;
  border: 1px solid red;
}
</style>