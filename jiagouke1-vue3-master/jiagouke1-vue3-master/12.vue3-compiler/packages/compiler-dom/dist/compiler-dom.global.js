var VueCompilerDOM = (function (exports) {
    'use strict';

    function isEnd(context) {
        const source = context.source;
        if (source.startsWith('</')) {
            return true;
        }
        return !source;
    }
    function advanceSpaces(context) {
        const match = /^[ \t\r\n]+/.exec(context.source);
        if (match) {
            advanceBy(context, match[0].length);
        }
    }
    function parseTag(context) {
        const start = getCursor(context); //<div/>
        // 最基本的元字符
        const match = /^<\/?([a-z][^ \t\r\n/>]*)/.exec(context.source); // igm
        const tag = match[1];
        advanceBy(context, match[0].length);
        advanceSpaces(context);
        const isSelfClosing = context.source.startsWith('/>');
        advanceBy(context, isSelfClosing ? 2 : 1);
        return {
            type: 1 /* ElEMENT */,
            tag,
            isSelfClosing,
            loc: getSelection(context, start)
        };
    }
    function parseElement(context) {
        // 1.解析标签名 
        let ele = parseTag(context); // <div></div>
        // 这里可能有儿子？
        const children = parseChildren(context); // 这里处理儿子的时候 有可能没有儿子，那就直接跳出？ 如果遇到结束标签就直接跳出就好了
        if (context.source.startsWith('</')) {
            parseTag(context); // 解析关闭标签时 同时会移除关闭信息并且更新偏移量
        }
        ele.children = children;
        ele.loc = getSelection(context, ele.loc.start);
        return ele;
    }
    function parseInterpolation(context) {
        const start = getCursor(context); // 获取表达式的start位置
        const closeIndex = context.source.indexOf('}}', '{{');
        advanceBy(context, 2);
        const innerStart = getCursor(context);
        const innerEnd = getCursor(context); // 这个end稍后我们会改
        const rawContentLength = closeIndex - 2; // 拿到{{ 内容 }}  包含空格的
        const preTrimContent = parseTextData(context, rawContentLength);
        const content = preTrimContent.trim(); // 去掉前后空格  "  name  "  name
        const startOffset = preTrimContent.indexOf(content); // {{  name  }}
        if (startOffset > 0) { // 有前面空格
            advancePositionWithMutation(innerStart, preTrimContent, startOffset);
        }
        // 在去更新innerEnd ？ 
        const endOffset = content.length + startOffset;
        advancePositionWithMutation(innerEnd, preTrimContent, endOffset);
        advanceBy(context, 2);
        return {
            type: 5 /* INTERPOLATION */,
            content: {
                type: 4 /* SIMPLE_EXPRESSION */,
                isStatic: false,
                loc: getSelection(context, innerStart, innerEnd),
                content
            },
            loc: getSelection(context, start)
        };
    }
    function getCursor(context) {
        let { line, column, offset } = context;
        return { line, column, offset };
    }
    function advancePositionWithMutation(context, s, endIndex) {
        // 如何更新时第几行?
        let linesCount = 0;
        let linePos = -1;
        for (let i = 0; i < endIndex; i++) {
            if (s.charCodeAt(i) == 10) { // 遇到换行就涨一行
                linesCount++;
                linePos = i; // 换行后第一个人的位置 
            }
        }
        context.offset += endIndex;
        context.line += linesCount;
        context.column = linePos == -1 ? context.column + endIndex : endIndex - linePos;
        // 如何更新列数
        // 更新偏移量
    }
    function advanceBy(context, endIndex) {
        let s = context.source; // 原内容
        // 计算出一个新的结束位置
        advancePositionWithMutation(context, s, endIndex); // 根据内容和结束索引来修改上下文的信息
        context.source = s.slice(endIndex); // 截取内容
    }
    function parseTextData(context, endIndex) {
        const rawText = context.source.slice(0, endIndex);
        advanceBy(context, endIndex); // 在context.source中把文本内容删除掉
        return rawText;
    }
    function getSelection(context, start, end) {
        end = end || getCursor(context);
        return {
            start,
            end,
            source: context.originalSource.slice(start.offset, end.offset)
        };
    }
    function parseText(context) {
        const endTokens = ['<', '{{'];
        let endIndex = context.source.length; // 文本的整个长度
        // 假设法 需要先假设 遇到 <  是结尾  在拿到遇到{{  去比较那个 在前 就是到哪
        for (let i = 0; i < endTokens.length; i++) {
            const index = context.source.indexOf(endTokens[i], 1);
            if (index !== -1 && endIndex > index) {
                endIndex = index;
            }
        }
        // 有了文本的结束位置 我就可以更新行列信息 
        let start = getCursor(context);
        const content = parseTextData(context, endIndex);
        return {
            type: 2 /* TEXT */,
            content,
            loc: getSelection(context, start)
        };
    }
    function parseChildren(context) {
        const nodes = [];
        while (!isEnd(context)) {
            const s = context.source; // 当前上下文中的内容  <  abc  {{}}
            let node;
            if (s[0] == '<') { // 标签
                node = parseElement(context);
            }
            else if (s.startsWith('{{')) { // 表达式  
                node = parseInterpolation(context);
            }
            else {
                node = parseText(context);
            }
            nodes.push(node);
        }
        nodes.forEach((node, index) => {
            if (node.type === 2 /* TEXT */) {
                if (!/[^ \t\r\n]/.test(node.content)) { // 只要没有内容，就删除掉
                    nodes[index] = null;
                }
                else {
                    node.content = node.content.replace(/[ \t\r\n]+/g, ' ');
                }
            }
        });
        return nodes.filter(Boolean); // 过滤null值
    }
    function createParserContext(content) {
        return {
            line: 1,
            column: 1,
            offset: 0,
            source: content,
            originalSource: content // 这个值是不会变的 记录你传入的内容
        };
    }
    function createRoot(children, loc) {
        return {
            type: 0 /* ROOT */,
            children,
            loc
        };
    }
    function baseParse(content) {
        // 标识节点的信息 行、列、偏移量...
        // 我每解析一段 就移除一部分 
        const context = createParserContext(content);
        const start = getCursor(context); // 记录开始位置
        return createRoot(parseChildren(context), getSelection(context, start));
    }

    const CREATE_VNODE = Symbol('createVnode');
    const TO_DISPALY_STRING = Symbol('toDisplayString');
    const OPEN_BLOCK = Symbol('openBlock');
    const CREATE_BLOCK = Symbol('createBlock');
    const FRAGMENT = Symbol('Fragment');
    const CREATE_TEXT = Symbol('createTextVNode');
    function createVnodeCall(context, tag, props, children, patchFlag) {
        context.helper(CREATE_VNODE);
        return {
            type: 13 /* VNODE_CALL */,
            tag,
            props,
            children,
            patchFlag
        };
    }
    function transformElement(node, context) {
        // 希望在整个树处理完毕后 在处理元素 
        if (node.type != 1 /* ElEMENT */) { // 此节点是元素
            return;
        }
        // ...
        return () => {
            // createVnode('h1',{},'helloworld',1) 向helper中添加一个createVnode
            const { tag, children } = node;
            let vnodeTag = `'${tag}'`;
            let vnodeProps; // props处理是想对复杂
            let vnodeChildren; // 处理好的儿子
            let vnodePatchFlag;
            let patchFlag = 0; // 用于标记这个标签是不是动态的
            if (children.length > 0) {
                if (children.length == 1) {
                    const child = children[0];
                    const type = child.type; // 看一下他是不是动态
                    const hasDymanicTextChild = type === 5 /* INTERPOLATION */ || type === 8 /* COMPOUND_EXPRESSION */;
                    if (hasDymanicTextChild) {
                        patchFlag |= 1 /* TEXT */;
                    }
                    vnodeChildren = child; // 直接把一个儿子拿出来即可
                }
                else {
                    vnodeChildren = children; // 多个儿子 不用处理
                }
            }
            if (patchFlag !== 0) {
                vnodePatchFlag = patchFlag + '';
            }
            node.codegenNode = createVnodeCall(context, vnodeTag, vnodeProps, vnodeChildren, vnodePatchFlag);
            console.log(context);
        };
    }
    function isText(node) {
        return node.type === 5 /* INTERPOLATION */ || node.type == 2 /* TEXT */;
    }
    function createCallExpression(callee, args) {
        return {
            type: 17 /* JS_CALL_EXPRESSION */,
            callee,
            arguments: args
        };
    }
    function transformText(node, context) {
        // {{name}} hello  => [children,children]  => createTextNode(name + ‘hello’) 
        if (node.type == 0 /* ROOT */ || node.type == 1 /* ElEMENT */) {
            // ...
            return () => {
                // 对元素中的文本进行合并操作
                let hasText = false;
                let children = node.children;
                let container = null;
                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    if (isText(child)) { // "hello hello" + name (div) +world+ 'hello'
                        hasText = true; // 当前元素确实有文本，我需要合并
                        for (let j = i + 1; j < children.length; j++) {
                            const next = children[j];
                            if (isText(next)) {
                                if (!container) {
                                    container = children[i] = {
                                        type: 8 /* COMPOUND_EXPRESSION */,
                                        loc: child.loc,
                                        children: [child]
                                    };
                                    container.children.push(`+`, next);
                                    children.splice(j, 1);
                                    j--;
                                }
                            }
                            else {
                                container = null;
                                break; // 跳过
                            }
                        }
                    }
                }
                // 文本需要增加 createText方法 helper里增加
                // <div>hello</div> 
                if (!hasText || children.length == 1) { // 只有一个孩子 在代码执行的时候 可以直接innerHTML 无需createText
                    return;
                }
                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    if (isText(child) || child.type == 8 /* COMPOUND_EXPRESSION */) {
                        const callArgs = []; // 用于存放参数的
                        callArgs.push(child); // 文本内容
                        if (child.type !== 2 /* TEXT */) {
                            callArgs.push(1 /* TEXT */ + '');
                        }
                        children[i] = {
                            type: 12 /* TEXT_CALL */,
                            content: child,
                            loc: child.loc,
                            codegenNode: createCallExpression(// 用于最后生成代码的
                            context.helper(CREATE_TEXT), callArgs)
                        };
                    }
                }
            };
        }
    }
    // 树结构  树的每一个节点进行转化
    function getBaseTransformPreset() {
        return [
            // 方法1 。。。
            transformElement,
            transformText
        ];
    }
    function createTransformContext(root, nodeTransforms) {
        const context = {
            root,
            currentNode: root,
            nodeTransforms,
            helpers: new Set(),
            helper(name) {
                context.helpers.add(name);
                return name;
            }
        };
        return context;
    }
    function traverseChildren(node, context) {
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            traverseNode(child, context);
        }
    }
    function traverseNode(node, context) {
        const { nodeTransforms } = context;
        context.currentNode = node;
        const exits = [];
        for (let i = 0; i < nodeTransforms.length; i++) {
            const onExit = nodeTransforms[i](node, context);
            if (onExit)
                exits.push(onExit);
        }
        switch (node.type) {
            case 0 /* ROOT */:
            case 1 /* ElEMENT */:
                traverseChildren(node, context);
            case 5 /* INTERPOLATION */: // name => {obj:aaa}.TOsTRING
                context.helper(TO_DISPALY_STRING);
        }
        let i = exits.length;
        // 为了保证退出方法对应的context.currentNode是正确的
        context.currentNode = node;
        while (i--) {
            exits[i]();
        }
    }
    function createRootCodegen(root, context) {
        const { helper } = context;
        const children = root.children;
        helper(OPEN_BLOCK);
        helper(CREATE_BLOCK);
        if (children.length == 1) {
            const child = children[0]; // 直接以当前这个孩子作为根节点
            const codegen = child.codegenNode; // 获取刚才元素转化后的codegen
            codegen.isBlock = true; // 只有一个儿子 那么他就是blocktree的根节点
            root.codegenNode = codegen; // 一个儿子直接把儿子的codegen挂载到最外层上
        }
        else if (children.length > 1) {
            root.codegenNode = createVnodeCall(context, helper(FRAGMENT), undefined, children, 64 /* STABLE_FRAGMENT */);
            root.codegenNode.isBlock = true;
        }
    }
    function transform(root, nodeTransforms) {
        const context = createTransformContext(root, nodeTransforms);
        traverseNode(root, context);
        createRootCodegen(root, context);
        root.helpers = [...context.helpers]; // context的属性 放到helpers上
    }

    const helperNameMap = {
        [FRAGMENT]: `Fragment`,
        [OPEN_BLOCK]: `openBlock`,
        [CREATE_BLOCK]: `createBlock`,
        [CREATE_VNODE]: `createVNode`,
        [TO_DISPALY_STRING]: "toDisplayString",
        [CREATE_TEXT]: "createTextVNode"
    };
    function createCodegenContext(ast) {
        const newLine = (n) => {
            context.push('\n' + '  '.repeat(n));
        };
        const context = {
            code: ``,
            push(c) {
                context.code += c;
            },
            helper(key) {
                return `${helperNameMap[key]}`;
            },
            indentLevel: 0,
            newLine() {
                newLine(context.indentLevel); // 换行
            },
            indent() {
                newLine(++context.indentLevel); // 缩进
            },
            deindent() {
                newLine(--context.indentLevel);
            }
        };
        return context;
    }
    function genVNodeCall(node, context) {
        const { push, helper } = context;
        const { tag, children, props, patchFlag, isBlock } = node;
        if (isBlock) {
            push(`(${helper(OPEN_BLOCK)}(),`);
            // 后面递归处理即可
        }
    }
    function genNode(node, context) {
        switch (node.type) {
            case 13 /* VNODE_CALL */:
                debugger;
                genVNodeCall(node, context);
                break;
        }
    }
    function generate(ast) {
        const context = createCodegenContext();
        const { push, newLine, indent, deindent } = context;
        push(`const _Vue = Vue`);
        newLine();
        push(`return function render(_ctx){`);
        indent();
        push(`with (_ctx) {`);
        indent();
        push(`const {${ast.helpers.map(s => `${helperNameMap[s]}`).join(',')}} = _Vue`);
        newLine();
        push(`return `); //需要根据转化后的结果 生成字符串
        genNode(ast.codegenNode, context);
        deindent();
        push(`}`);
        deindent();
        push(`}`);
        return context.code;
    }
    function baseCompile(template) {
        // 讲模板转换成ast语法树
        const ast = baseParse(template);
        // 将ast语法进行转化 （优化 静态提升 方法缓存  生成代码为了最终生成代码时使用）
        const nodeTransforms = getBaseTransformPreset(); // nodeTransforms 每遍历到一个节点都要调用里面的方法
        transform(ast, nodeTransforms);
        // 根节点 的处理我在最外面 进行了一次包裹
        return generate(ast); // 在生成的过程中 需要创建一个字符串拼接后的结果
    }
    // 最终结果还是new Function
    // 从 template - > ast语法树   (vue里面 有指令 有插槽 有事件)
    // ast - > transform -> codegen

    exports.baseCompile = baseCompile;
    exports.helperNameMap = helperNameMap;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
//# sourceMappingURL=compiler-dom.global.js.map
