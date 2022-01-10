/* 

<div :class="c" class="demo" v-if="isShow">
    <span v-for="item in sz">{{item}}</span>
</div>

*/

var html = '<div :class="c" class="demo" v-if="isShow"><span v-for="item in sz">{{item}}</span></div>';

/* parse~~~~~~~~~~~~~~~~~~~~~ 
parse会用正则等方式将template模块中进行字符串解析，得到指令,class,style等数据，形成AST

*/


function advance(n) {
  index += n
  html = html.substring(n)
}




