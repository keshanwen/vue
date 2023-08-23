// 1.希望拿到packages 下的所有包 
const fs = require('fs'); // node中的一个文件读取模块 


// execa 可以单独开一个子进程执行命令 node中得一个模块
const execa = require('execa'); // 作用是单独开启一个进程进行打包
// 读取文件夹的目录
const targets = fs.readdirSync('packages').filter(item => {
    // 判断文件或文件夹的状态 
    return fs.statSync(`packages/${item}`).isDirectory()
})

async function build(target){
    // rollup -c --enviroment TARGET:shared
    return execa('rollup',['-c','--environment','TARGET:'+target],{stdio:'inherit'}); // 表示子进程中的输出结果会输出到父进程中 
}

function runAll(targets){
    let results = [];
    for(target of targets){
        results.push(build(target));
    }
    return Promise.all(results); // 多个文件夹并行打包
}


// 打包这些文件
runAll(targets).then(()=>{
    console.log('打包完毕')
})