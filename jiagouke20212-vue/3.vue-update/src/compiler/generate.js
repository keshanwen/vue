const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{   xxx  }}  

function genProps(attrs) {
    // {key:value,key:value,}
    let str = '';
    for (let i = 0; i < attrs.length; i++) {
        let attr = attrs[i];
        if (attr.name === 'style') { // {name:id,value:'app'}
            let styles = {}
            attr.value.replace(/([^;:]+):([^;:]+)/g, function() {
                styles[arguments[1]] = arguments[2];
            })
            attr.value = styles
        }
        str += `${attr.name}:${JSON.stringify(attr.value)},`
    }
    return `{${str.slice(0,-1)}}`
}

function gen(el) {
    if (el.type == 1) {
        return generate(el); // 如果是元素就递归的生成
    } else {
        let text = el.text; // {{}}
        if (!defaultTagRE.test(text)) return `_v('${text}')`; // 说明就是普通文本

        // 说明有表达式 我需要 做一个表达式和普通值的拼接 ['aaaa',_s(name),'bbb'].join('+)
        // _v('aaaa'+_s(name) + 'bbb')
        let lastIndex = defaultTagRE.lastIndex = 0;
        let tokens = []; // <div> aaa{{bbb}} aaa </div>
        let match;

        // ，每次匹配的时候 lastIndex 会自动向后移动
        while (match = defaultTagRE.exec(text)) { // 如果正则 + g 配合exec 就会有一个问题 lastIndex的问题
            let index = match.index;
            if(index > lastIndex){
                tokens.push(JSON.stringify(text.slice(lastIndex,index)));
            }
            tokens.push(`_s(${match[1].trim()})`);
            lastIndex = index + match[0].length;
        }
        if(lastIndex < text.length){
            tokens.push(JSON.stringify(text.slice(lastIndex)));
        }
        return `_v(${tokens.join('+')})`; // webpack 源码 css-loader  图片处理
    }
}

function genChildren(el) {
    let children = el.children;
    if (children) {
        return children.map(item => gen(item)).join(',')
    }
    return false;
}

// _c(div,{},c1,c2,c3,c4)
export function generate(ast) {
    let children = genChildren(ast)
    let code = `_c('${ast.tag}',${
        ast.attrs.length?genProps(ast.attrs) :'undefined'
    }${
        children? `,${children}` :''
    })`
    return code;
}