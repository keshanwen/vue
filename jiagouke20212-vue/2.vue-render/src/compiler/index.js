import { generate } from "./generate";
import { parserHTML } from "./parser";


export function compileToFunction(template) {

    // 1.将模板变成ast语法树
    let ast = parserHTML(template);

    // 代码优化 标记静态节点

    // 2.代码生成
    let code = generate(ast);  // 模板引擎的实现原理 都是 new Function + with  ejs jade handlerbar...
    let render = new Function(`with(this){return ${code}}`);

    return render;
    // 1.编译原理
    // 2.响应式原理 依赖收集
    // 3.组件化开发 （贯穿了vue的流程）
    // 4.diff算法 
}

