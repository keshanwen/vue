import path from 'path'
import ts from 'rollup-plugin-typescript2';
import serve from 'rollup-plugin-serve'
export default {
    input:'./src/index.ts',
    output:{
        file:path.resolve(__dirname,'dist/bundle.js'),
        format:'iife', // 自执行函数
        sourcemap:true
    },
    plugins:[
        ts({
            tsconfig:path.resolve(__dirname,'tsconfig.json')
        }),
        serve({
            // open:true, // 自动打开
            // openPage:'/public/index.html',
            contentBase:'',
            port:3000
        })
    ]
}