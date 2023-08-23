

<template>
  <div>
    {{ ruleForm }}
    <el-form :model="ruleForm" :rules="rules" ref="ruleForm">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="ruleForm.username"></el-input>
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input :value="ruleForm.password" @input="val=>ruleForm.password = val"></el-input>
      </el-form-item>
      <el-form-item>
        <button @click="submitForm('ruleForm')">提交</button>
      </el-form-item>
    </el-form>
  </div>

  <!-- el-form 就是传递所有数据的 还要校验规则的 -->
  <!-- el-form-item 主要的作用就是校验是否合法 -->
  <!-- el-input 就是绑定数据的 -->
</template>
<script>
import ElForm from './el-form.vue';
import ElFormItem from './el-form-item.vue';
import ElInput from './el-input.vue';
export default {
  components: {
    ElForm,
    ElFormItem,
    ElInput
  },
  data() {
    return {
      ruleForm: {
        username: '123',
        password: '456',
      },
      rules: {
        username: [
          { required: true, message: '请输入用户名称', trigger: 'blur' },
          { min: 3, max: 5, message: '长度在 3 到 5 个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'change' }
        ]
      }
    };
  },
  methods: {
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          alert('submit!');
        } else {
          console.log('error submit!!');
          return false;
        }
      });
    }
  }
}
// 组件的通信原理 provide / inject $on / $emit  $parent /$children
// $boradcast $dispatch
</script>  

