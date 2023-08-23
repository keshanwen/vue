

let path = require('path')
let ts = require('rollup-plugin-typescript2')
let resolvePlugin = require('@rollup/plugin-node-resolve').default

// 1.获取整个packages目录
let packagesDir = path.resolve(__dirname,'packages');

// 根据调用rollup时候的参数 来进行动态打包， 找到具体要打包哪个模块
const name = process.env.TARGET;

const packageDir = path.resolve(packagesDir,name)

// 根据当前模块解析文件
const currentResolve = (p) => path.resolve(packageDir,p)

// 我需要拿到package.json 中的内容
const pkg = require(currentResolve('package.json'));

// 读取自己设定的对象 
const options = pkg.buildOptions

// "cjs", "esm-bundler", "global"
const outputConfig = {
    cjs:{
        file:currentResolve(`dist/${name}.cjs.js`),
        format:'cjs'
    },
    global:{
        file:currentResolve(`dist/${name}.global.js`),
        format:'iife'
    },
    'esm-bundler':{
        file:currentResolve(`dist/${name}.esm-bundler.js`),
        format:'esm'
    }
}
// rollup的配置可以返回一个数组
function createConfig(output){ // 出口信息
    output.name = options.name;
    output.sourcemap = true;
    return {
        input:currentResolve('src/index.ts'),
        output,
        plugins:[
            ts({ // 打包时候调用ts的配置文件
                tsconfig: path.resolve(__dirname,'tsconfig.json')
            }),
            resolvePlugin() // 解析后缀的 文件模块得引入 
        ]
    }

}
export default options.formats.map(f=>createConfig(outputConfig[f]))
