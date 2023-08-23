import { isSameVnode } from ".";

export function patch(oldVnode, vnode) {

    if(!oldVnode){ // 组件的挂载流程 
        return createElm(vnode); // 产生一个组件的真实节点
    }

    const isRealElement = oldVnode.nodeType

    if (isRealElement) {
        // 删除老节点 根据vnode创建新节点，替换掉老节点
        const elm = createElm(vnode);
        const parentNode = oldVnode.parentNode;
        parentNode.insertBefore(elm, oldVnode.nextSibling);
        parentNode.removeChild(oldVnode);
        return elm; // 返回最新节点
    } else { // 不管怎么diff 最终想更新渲染 =》 dom操作里去

        // 只比较同级，如果不一样，儿子就不用比对了， 根据当前节点，创建儿子 全部替换掉 
        // diff 算法如何实现？
        if (!isSameVnode(oldVnode, vnode)) { // 如果新旧节点 不是同一个，删除老的换成新的
            return oldVnode.el.parentNode.replaceChild(createElm(vnode), oldVnode.el)
        }

        // 文本直接更新即可，因为文本没有儿子
        let el = vnode.el = oldVnode.el; // 复用节点
        if (!oldVnode.tag) { // 文本了, 一个是文本 那么另一个一定也是文本
            if (oldVnode.text !== vnode.text) {
                return el.textContent = vnode.text
            }
        }
        // 元素  新的虚拟节点
        updateProperties(vnode, oldVnode.data);
        // 是相同节点了，复用节点，在更新不一样的地方 （属性）

        // 比较儿子节点
        let oldChildren = oldVnode.children || [];
        let newChildren = vnode.children || [];

        // 情况1 ：老的有儿子 ， 新没儿子

        if (oldChildren.length > 0 && newChildren.length == 0) {
            el.innerHTML = '';
            // 新的有儿子 老的没儿子 直接将新的插入即可
        } else if (newChildren.length > 0 && oldChildren.length == 0) {
            newChildren.forEach(child => el.appendChild(createElm(child)))
        } else {
            // 新老都有儿子
            updateChildren(el, oldChildren, newChildren);
        }
        return el
    }
}

function updateChildren(el, oldChildren, newChildren) {
    // vue2中 如何做的diff算法

    // vue内部做了优化 （能尽量提升性能，如果实在不行，在暴力比对）
    // 1.在列表中新增和删除的情况

    let oldStartIndex = 0;
    let oldStartVnode = oldChildren[0];
    let oldEndIndex = oldChildren.length - 1;
    let oldEndVnode = oldChildren[oldEndIndex];


    let newStartIndex = 0;
    let newStartVnode = newChildren[0];
    let newEndIndex = newChildren.length - 1;
    let newEndVnode = newChildren[newEndIndex];

    function makeKeyByIndex(children){
        let map = {}
        children.forEach((item,index)=>{
            map[item.key] = index;
        })
        return map;
    }

    let mapping = makeKeyByIndex(oldChildren)

    // diff算法的复杂度 是O(n)  比对的时候 指针交叉的时候 就是比对完成了
    while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        if(!oldStartVnode){ // 在指针移动的时候 可能元素已经被移动走了，那就跳过这一项
            oldStartVnode = oldChildren[++oldStartIndex]
        }else if(!oldEndVnode){
            oldEndVnode = oldChildren[--oldEndIndex]
        }else if (isSameVnode(oldStartVnode, newStartVnode)) { // 头头比较
            patch(oldStartVnode, newStartVnode); // 会递归比较子节点，同时比对这两个人的差异
            oldStartVnode = oldChildren[++oldStartIndex];
            newStartVnode = newChildren[++newStartIndex];
        }else if(isSameVnode(oldEndVnode, newEndVnode)){ // 尾尾比较
            patch(oldEndVnode, newEndVnode); 
            oldEndVnode = oldChildren[--oldEndIndex];
            newEndVnode = newChildren[--newEndIndex];
        }else if(isSameVnode(oldStartVnode,newEndVnode)){ // 头尾
            patch(oldStartVnode , newEndVnode);
            el.insertBefore(oldStartVnode.el,oldEndVnode.el.nextSibling)
            oldStartVnode = oldChildren[++oldStartIndex];
            newEndVnode = newChildren[--newEndIndex];
        }else if(isSameVnode(oldEndVnode,newStartVnode)){ // 尾头
            patch(oldEndVnode , newStartVnode);
            el.insertBefore(oldEndVnode.el,oldStartVnode.el);// 将尾部的插入到头部去
            oldEndVnode = oldChildren[--oldEndIndex];
            newStartVnode = newChildren[++newStartIndex];
        }else{
            // 之前的逻辑都是考虑 用户一些特殊情况，但是有非特殊的，乱序排
            let moveIndex = mapping[newStartVnode.key];
            if(moveIndex == undefined){
                // 没有直接将节点插入到开头的前面
                el.insertBefore(createElm(newStartVnode),oldStartVnode.el)
            }else{
                // 有的话需要复用
                let moveVnode = oldChildren[moveIndex]; // 找到复用的那个人，将他移动到前面去
                patch(moveVnode,newStartVnode);
                el.insertBefore(moveVnode.el,oldStartVnode.el);
                oldChildren[moveIndex] = undefined; // 将移动的节点标记为空
            }
            newStartVnode = newChildren[++newStartIndex]
        }
    }
    if (newStartIndex <= newEndIndex) { // 新的多，那么就将多的插入进去即可
        // 如果下一个是null 就是appendChild
        let anchor = newChildren[newEndIndex + 1] == null ? null : newChildren[newEndIndex+1].el; // 参照物是固定的
        for (let i = newStartIndex; i <= newEndIndex; i++) {
            // 看一下 当前尾节点的下一个元素是否存在，如果存在则是插入到下一个元素的前面
            // 这里可能是向前追加 可能是像后追加
            el.insertBefore(createElm(newChildren[i]),anchor)
        }
    }
    if(oldStartIndex <= oldEndIndex){// 老的多余的  ,需要清理掉，直接删除即可
        for(let i = oldStartIndex ;i <= oldEndIndex ;i++){ 
            let child = oldChildren[i]; // 因为child可能是undefined 所有要跳过空间点
            child && el.removeChild(child.el);
        }
    }
}

function createComponent(vnode){ // 给组件预留了 一个初始化流程 init
    let i = vnode.data;
    if((i = i.hook) && (i = i.init)){
        i(vnode)
    }
    if(vnode.componentInstance){ // 说明是组件
        return true;
    }
}


export function createElm(vnode) {
    let { tag, data, children, text, vm } = vnode;
    if (typeof tag === 'string') {
        if(createComponent(vnode)){ // 返回一个组件的真实节点
            return vnode.componentInstance.$el; // 对应的就是真实节点
        }


        vnode.el = document.createElement(tag); // 先创建id app
        updateProperties(vnode);
        children.forEach(child => { // 在去查找id app的儿子，对儿子进行创建 {tag:'组件',componentOpions}
            vnode.el.appendChild(createElm(child)); // createElm(child) 有创建有创建组件和元素的功能
        })
    } else {
        vnode.el = document.createTextNode(text);
    }
    return vnode.el
}

function updateProperties(vnode, oldProps = {}) {
    // 这里的逻辑 可能是初次渲染，初次渲染 直接 用oldProps 给vnode的el赋值即可
    // 更新逻辑 拿到老的props 和 vnode里面的data进行比对
    let el = vnode.el; // dom真实的节点
    let newProps = vnode.data || {};
    // 新旧比对， 两个对象如何比对差异？
    let newStyle = newProps.style || {};
    let oldStyle = oldProps.style || {};

    for (let key in oldStyle) { // 老的样式有 新的没有，就把页面上的样式删除掉
        if (!newStyle[key]) {
            el.style[key] = '';
        }
    }
    for (let key in newProps) { //  直接用新的改掉老的就可以了
        // 如果前后一样，浏览器会去检测
        if (key == 'style') {
            for (let key in newStyle) { // {style:{color:red}}
                el.style[key] = newStyle[key]
            }
        } else {
            el.setAttribute(key, newProps[key]);
        }
    }
    for (let key in oldProps) {
        if (!newProps[key]) {
            el.removeAttribute(key);
        }
    }
}