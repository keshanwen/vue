<script setup>
import { useCounterStore1 } from "@/stores/counter1";
import { useCounterStore2 } from "./stores/counter2";
const store1 = useCounterStore1();
console.log(store1, 'stroe1~~~~~~')
const { increment } = useCounterStore1();
const handleClick1 = () => {
  increment(3);
};

const store2 = useCounterStore2();

const handleClick2 = () => {
  store2.increment(3);
};
</script>

<template>
  ----------------options-------------- <br />
  {{ store1.count }} /
  {{ store1.double }}
  <button @click="handleClick1">修改状态</button>
  <hr color="red" />

  ----------------setup--------------<br />
  {{ store2.count }}
  {{ store2.double }}

  <button @click="handleClick2">修改状态</button>
</template>

<style scoped></style>
