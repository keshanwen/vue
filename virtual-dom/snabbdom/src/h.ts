import { vnode, VNode, VNodeData } from "./vnode";
import * as is from "./is";

export type VNodes = VNode[];
export type VNodeChildElement = VNode | string | number | undefined | null;
export type ArrayOrElement<T> = T | T[];
export type VNodeChildren = ArrayOrElement<VNodeChildElement>;

function addNS(
  data: any,
  children: VNodes | undefined,
  sel: string | undefined
): void {
  data.ns = "http://www.w3.org/2000/svg";
  if (sel !== "foreignObject" && children !== undefined) {
    for (let i = 0; i < children.length; ++i) {
      const childData = children[i].data;
      if (childData !== undefined) {
        addNS(childData, children[i].children as VNodes, children[i].sel);
      }
    }
  }
}

// h函数的重载(通过传入不同的参数个数，去执行对应的方法（虽然方法名称是一样的）)
export function h(sel: string): VNode;
export function h(sel: string, data: VNodeData | null): VNode;
export function h(sel: string, children: VNodeChildren): VNode;
export function h(
  sel: string,
  data: VNodeData | null,
  children: VNodeChildren
): VNode;
// 导出模块
/*
snabbdom的核心

1，使用h函数创建javascript对象（vnode）描述真实Dom

2， init()设置模块，创建patch()

3, patch() 比较新旧两个Vnode

4,把变化的内容更到真实DOM树上

*/ 
export function h(sel: any, b?: any, c?: any): VNode {
  let data: VNodeData = {};
  let children: any;
  let text: any;
  let i: number;
  // 处理参数,实现重载的机制
  if (c !== undefined) {
    // 处理3个参数的情况
    // sel ,data, children/text
    if (b !== null) {
      data = b;
    }
    if (is.array(c)) {
      children = c;
      // 如果c 是字符串或者数字
    } else if (is.primitive(c)) {
      text = c;
      // 如果c是vnode
    } else if (c && c.sel) {
      children = [c];
    }
  } else if (b !== undefined && b !== null) {
    // 处理两个参数的情况
    // 如果b是数组
    if (is.array(b)) {
      children = b;
      // 如果b是字符串或者数字
    } else if (is.primitive(b)) {
      text = b;
      // 如果b是vnode
    } else if (b && b.sel) {
      children = [b];
    } else {
      data = b;
    }
  }
  if (children !== undefined) {
    // 如果children 中的原始值（string/number）
    for (i = 0; i < children.length; ++i) {
      // 如果children是string/number,创建文本节点
      // 全部转换为vnode
      if (is.primitive(children[i]))
        children[i] = vnode(
          undefined,
          undefined,
          undefined,
          children[i],
          undefined
        );
    }
  }
  if (
    sel[0] === "s" &&
    sel[1] === "v" &&
    sel[2] === "g" &&
    (sel.length === 3 || sel[3] === "." || sel[3] === "#")
  ) {
    // 如果是 svg ，添加命名空间
    addNS(data, children, sel);
  }
  // 返回 VNode
  return vnode(sel, data, children, text, undefined);
}
