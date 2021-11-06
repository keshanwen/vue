<template>
   <div>
     i am vuex demo
     <h1>
       {{ this.$store.getters.myName }}
     </h1>
   </div>
</template>

<script>
export default {
  name: 'myVuex'
}
</script>

<style>

</style>