// 专门为了开发而使用得
const fs = require('fs');
const execa = require('execa');

const target = 'runtime-dom'; // 在开发得时候 我可以指定打包得具体是哪一个模块，只有 npm run build得时候才需要对 pacakges 下得所有模块进行打包

async function build(target){
    // rollup -c --enviroment TARGET:shared
    return execa('rollup',['-cw','--environment','TARGET:'+target],{stdio:'inherit'}); // 表示子进程中的输出结果会输出到父进程中 
}
build(target)