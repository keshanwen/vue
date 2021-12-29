<template>
  <div>
    <myTalbe :columns="columns" :data="data">
        <template slot-scope="{ row, index }" slot="action">
          <button>操作</button>
        </template>  
    </myTalbe>
  </div>
</template>

<script>
import myTalbe from './component/index'
export default {
  name: 'tableDemo',

  components: {
    myTalbe
  },

  data() {
    return {
       columns: [
                    {
                        title: '姓名',
                        key: 'name'
                        // slot: 'name'
                    },
                    {
                        title: '年龄',
                          key: 'age'
                        // slot: 'age'
                    },
                    {
                        title: '出生日期',
                          key: 'birthday'
                        // slot: 'birthday'
                    },
                    {
                        title: '地址',
                          key:'address'
                        // slot: 'address'
                    },
                    {
                        title: '操作',
                        slot: 'action'
                    }
                ],
                data: [
                    {
                        name: '王小明',
                        age: 18,
                        birthday: '919526400000',
                        address: '北京市朝阳区芍药居'
                    },
                    {
                        name: '张小刚',
                        age: 25,
                        birthday: '696096000000',
                        address: '北京市海淀区西二旗'
                    },
                    {
                        name: '李小红',
                        age: 30,
                        birthday: '563472000000',
                        address: '上海市浦东新区世纪大道'
                    },
                    {
                        name: '周小伟',
                        age: 26,
                        birthday: '687024000000',
                        address: '深圳市南山区深南大道'
                    }
                ],
    }
  }
}
</script>

<style>

</style>