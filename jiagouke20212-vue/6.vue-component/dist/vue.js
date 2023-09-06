(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
}(this, (function () { 'use strict';

    const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{   xxx  }}  

    function genProps(attrs) {
      // {key:value,key:value,}
      let str = '';

      for (let i = 0; i < attrs.length; i++) {
        let attr = attrs[i];

        if (attr.name === 'style') {
          // {name:id,value:'app'}
          let styles = {};
          attr.value.replace(/([^;:]+):([^;:]+)/g, function () {
            styles[arguments[1]] = arguments[2];
          });
          attr.value = styles;
        }

        str += `${attr.name}:${JSON.stringify(attr.value)},`;
      }

      return `{${str.slice(0, -1)}}`;
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

        let match; // ，每次匹配的时候 lastIndex 会自动向后移动

        while (match = defaultTagRE.exec(text)) {
          // 如果正则 + g 配合exec 就会有一个问题 lastIndex的问题
          let index = match.index;

          if (index > lastIndex) {
            tokens.push(JSON.stringify(text.slice(lastIndex, index)));
          }

          tokens.push(`_s(${match[1].trim()})`);
          lastIndex = index + match[0].length;
        }

        if (lastIndex < text.length) {
          tokens.push(JSON.stringify(text.slice(lastIndex)));
        }

        return `_v(${tokens.join('+')})`; // webpack 源码 css-loader  图片处理
      }
    }

    function genChildren(el) {
      let children = el.children;

      if (children) {
        return children.map(item => gen(item)).join(',');
      }

      return false;
    } // _c(div,{},c1,c2,c3,c4)


    function generate(ast) {
      let children = genChildren(ast);
      let code = `_c('${ast.tag}',${ast.attrs.length ? genProps(ast.attrs) : 'undefined'}${children ? `,${children}` : ''})`;
      return code;
    }

    const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // 匹配标签名的  aa-xxx

    const qnameCapture = `((?:${ncname}\\:)?${ncname})`; //  aa:aa-xxx  

    const startTagOpen = new RegExp(`^<${qnameCapture}`); //  此正则可以匹配到标签名 匹配到结果的第一个(索引第一个) [1]

    const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配标签结尾的 </div>  [1]

    const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性的
    // [1]属性的key   [3] || [4] ||[5] 属性的值  a=1  a='1'  a=""

    const startTagClose = /^\s*(\/?)>/; // 匹配标签结束的  />    > 
    // vue3的编译原理比vue2里好很多，没有这么多正则了

    function parserHTML(html) {
      // 可以不停的截取模板，直到把模板全部解析完毕 
      let stack = [];
      let root = null; // 我要构建父子关系  

      function createASTElement(tag, attrs, parent = null) {
        return {
          tag,
          type: 1,
          // 元素
          children: [],
          parent,
          attrs
        };
      }

      function start(tag, attrs) {
        // [div,p]
        // 遇到开始标签 就取栈中的最后一个作为父节点
        let parent = stack[stack.length - 1];
        let element = createASTElement(tag, attrs, parent);

        if (root == null) {
          // 说明当前节点就是根节点
          root = element;
        }

        if (parent) {
          element.parent = parent; // 跟新p的parent属性 指向parent

          parent.children.push(element);
        }

        stack.push(element);
      }

      function end(tagName) {
        let endTag = stack.pop();

        if (endTag.tag != tagName) {
          console.log('标签出错');
        }
      }

      function text(chars) {
        let parent = stack[stack.length - 1];
        chars = chars.replace(/\s/g, "");

        if (chars) {
          parent.children.push({
            type: 2,
            text: chars
          });
        }
      }

      function advance(len) {
        html = html.substring(len);
      }

      function parseStartTag() {
        const start = html.match(startTagOpen); // 4.30 继续

        if (start) {
          const match = {
            tagName: start[1],
            attrs: []
          };
          advance(start[0].length);
          let end;
          let attr;

          while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
            // 1要有属性 2，不能为开始的结束标签 <div>
            match.attrs.push({
              name: attr[1],
              value: attr[3] || attr[4] || attr[5]
            });
            advance(attr[0].length);
          } // <div id="app" a=1 b=2 >


          if (end) {
            advance(end[0].length);
          }

          return match;
        }

        return false;
      }

      while (html) {
        // 解析标签和文本   
        let index = html.indexOf('<');

        if (index == 0) {
          // 解析开始标签 并且把属性也解析出来  </div>
          const startTagMatch = parseStartTag();

          if (startTagMatch) {
            // 开始标签
            start(startTagMatch.tagName, startTagMatch.attrs);
            continue;
          }

          let endTagMatch;

          if (endTagMatch = html.match(endTag)) {
            // 结束标签
            end(endTagMatch[1]);
            advance(endTagMatch[0].length);
            continue;
          }
        } // 文本


        if (index > 0) {
          // 文本
          let chars = html.substring(0, index); //<div></div>

          text(chars);
          advance(chars.length);
        }
      }

      return root;
    } //  <div id="app">hello wolrd <span>hello</span></div> */}

    function compileToFunction(template) {
      // 1.将模板变成ast语法树
      let ast = parserHTML(template); // 代码优化 标记静态节点
      // 2.代码生成

      let code = generate(ast); // 模板引擎的实现原理 都是 new Function + with  ejs jade handlerbar...

      let render = new Function(`with(this){return ${code}}`);
      return render; // 1.编译原理
      // 2.响应式原理 依赖收集
      // 3.组件化开发 （贯穿了vue的流程）
      // 4.diff算法 
    }

    function isFunction(val) {
      return typeof val == 'function';
    }
    function isObject(val) {
      return typeof val == 'object' && val !== null;
    }
    let callbacks = [];
    let waiting = false;

    function flushCallbacks() {
      callbacks.forEach(fn => fn()); // 按照顺序清空nextTick

      callbacks = [];
      waiting = false;
    }

    function nextTick(fn) {
      // vue3 里面的nextTick 就是promise ， vue2里面做了一些兼容性处理
      callbacks.push(fn);

      if (!waiting) {
        Promise.resolve().then(flushCallbacks);
        waiting = true;
      }
    }
    let isArray = Array.isArray;
    let strats = {};
    let lifeCycle = ['beforeCreate', 'created', 'beforeMount', 'mounted'];
    lifeCycle.forEach(hook => {
      strats[hook] = function (parentVal, childVal) {
        if (childVal) {
          if (parentVal) {
            return parentVal.concat(childVal);
          } else {
            // 儿子有值 父亲没有值
            if (isArray(childVal)) {
              return childVal;
            } else {
              return [childVal];
            }
          }
        } else {
          return parentVal;
        }
      };
    });

    strats.components = function (parentVal, childVal) {
      // childVal.__proto__ = parentVal
      let res = Object.create(parentVal); // 合并后产生一个新对象 ，不用原来的

      if (childVal) {
        for (let key in childVal) {
          res[key] = childVal[key];
        }
      }

      return res;
    };

    function mergeOptions(parentVal, childVal) {
      const options = {};

      for (let key in parentVal) {
        mergeFiled(key);
      }

      for (let key in childVal) {
        if (!parentVal.hasOwnProperty(key)) {
          mergeFiled(key);
        }
      }

      function mergeFiled(key) {
        let strat = strats[key];

        if (strat) {
          options[key] = strat(parentVal[key], childVal[key]);
        } else {
          options[key] = childVal[key] || parentVal[key];
        }
      }

      return options;
    }

    function makeMap(str) {
      let tagList = str.split(',');
      return function (tagName) {
        return tagList.includes(tagName);
      };
    }

    const isReservedTag = makeMap('template,script,style,element,content,slot,link,meta,svg,view,button,' + 'a,div,img,image,text,span,input,switch,textarea,spinner,select,' + 'slider,slider-neighbor,indicator,canvas,' + 'list,cell,header,loading,loading-indicator,refresh,scrollable,scroller,' + 'video,web,embed,tabbar,tabheader,datepicker,timepicker,marquee,countdown');

    function initGlobalAPI(Vue) {
      Vue.options = {}; // 全局属性 , 在每个组件初始化的时候 将这些属性放到每个组件上

      Vue.mixin = function (options) {
        // Vue.options = 合并后的结果
        this.options = mergeOptions(this.options, options);
        return this;
      }; // Vue.component -> Vue.extend


      Vue.options._base = Vue; // 等会我通过Vue.extend 方法可以产生一个子类，new 子类的时候会执行代码初始化流程 (组件的初始化)

      Vue.extend = function (opt) {
        // 会产生一个子类  data
        const Super = this;

        const Sub = function (options) {
          // 创造一个组件 其实就是 new 这个组件的类 （组件的初始化）
          this._init(options);
        }; //  Object.create  Object.setPrototypeOf()
        // Sub.prototype.__proto__ = Super.prototype
        // function create(parentProtptype){
        //     const Fn = function(){}
        //     Fn.prototype = parentProtptype
        //     return new Fn;
        // }


        Sub.prototype = Object.create(Super.prototype); // 继承原型方法

        Sub.prototype.constructor = Sub; // Object.create 会产生一个新的实例作为 子类的原型，此时constructor 会指向错误

        Sub.options = mergeOptions(Super.options, opt); // 需要让子类 能拿到 我们Vue定义的全局组件

        return Sub;
      };

      Vue.options.components = {}; // 存放全局组件的

      Vue.component = function (id, definition) {
        // definition 可以传入对象或者函数
        let name = definition.name || id;
        definition.name = name;

        if (isObject(definition)) {
          definition = Vue.extend(definition);
        }

        Vue.options.components[name] = definition; // 维护关系
      };
    }

    let id$1 = 0; // dep.subs = [watcher];
    // watcher.deps = [dep]

    class Dep {
      constructor() {
        // 要把watcher放到dep中
        this.subs = [];
        this.id = id$1++;
      }

      depend() {
        // 要给watcher也加一个标识 防止重复
        // this.subs.push(Dep.target); // 让dep记住这个watcher, watcher还要记住dep  相互的关系
        Dep.target.addDep(this); // 在watcher中在调用dep的addSub方法
      }

      addSub(watcher) {
        this.subs.push(watcher); // 让dep记住watcher
      }

      notify() {
        this.subs.forEach(watcher => watcher.update());
      }

    }

    Dep.target = null; // 这里我用了一个全局的变量 window.target  静态属性

    let queue = []; // 这里存放要更新的watcher

    let has = {}; // 用来存储已有的watcher的id

    function flushSchedulerQueue() {
      // beforeUpdate
      queue.forEach(watcher => watcher.run());
      queue = []; // 这里存放要更新的watcher

      has = {};
      pending = false;
    }

    let pending = false;
    function queueWatcher(watcher) {
      // watcher1 watcher1 watcher1 watcher1  watcher2
      // 一般情况下 写去重 可以采用这种方式 ，如果你不使用set的时候
      let id = watcher.id;

      if (has[id] == null) {
        has[id] = true;
        queue.push(watcher); // [watcher1,watcher2]

        if (!pending) {
          // 防抖 多次执行 只走1次
          nextTick(flushSchedulerQueue);
          pending = true;
        }
      }
    }

    let id = 0;

    class Watcher {
      constructor(vm, fn, cb, options) {
        // $watch()  要将dep放到watcher中
        this.vm = vm;
        this.fn = fn;
        this.cb = cb;
        this.options = options;
        this.id = id++;
        this.depsId = new Set();
        this.deps = [];
        this.getter = fn; // fn就是页面渲染逻辑

        this.get(); // 表示上来后就做一次初始化
      }

      addDep(dep) {
        let did = dep.id;

        if (!this.depsId.has(did)) {
          this.depsId.add(did);
          this.deps.push(dep); // 做了保存id的功能 并且让watcher记住dep

          dep.addSub(this);
        }
      }

      get() {
        Dep.target = this; // Dep.target = watcher

        this.getter(); // 页面渲染的逻辑  vm.name / vm.age  

        Dep.target = null; // 渲染完毕后 就将标识清空了， 只有在渲染的时候才会进行依赖收集
      }

      update() {
        // 每次更新数据都会同步调用这个update方法，我可以将更新的逻辑缓存起来，等会同步更新数据的逻辑执行完毕后，依次调用 (去重的逻辑)
        console.log('缓存更新');
        queueWatcher(this); // 可以做异步更新处理
        // this.get(); // vue.nextTick  [fn3]
      }

      run() {
        console.log('真正执行更新');
        this.get(); // render() 取最新的vm上的数据
      }

    }

    function createComponent$1(vm, tag, data, children, key, Ctor) {
      if (isObject(Ctor)) {
        // 组件的定义一定是通过Vue.extend 进行包裹的
        Ctor = vm.$options._base.extend(Ctor);
      }

      data.hook = {
        // 组件的生命周期 
        init(vnode) {
          // vnode.componentInstance.$el -> 对应组件渲染完毕后的结果
          let child = vnode.componentInstance = new Ctor({}); //我想获取组件的真实dom

          child.$mount(); // 所以组件在走挂载的流程时 vm.$el 为null
          // mount挂载完毕后 会产生一个真实节点，这个节点在 vm.$el上-》 对应的就是组件的真实内容
        },

        prepatch() {},

        postpatch() {} /// 


      }; // 每个组件 默认的名字内部会给你拼接一下  vue-component-1-my-button

      let componentVnode = vnode(vm, tag, data, undefined, key, undefined, {
        Ctor,
        children,
        tag
      }); // componentOptions 存放了一个重要的属性交Ctor 构造函数

      return componentVnode;
    }

    function createElement(vm, tag, data = {}, ...children) {
      // 返回虚拟节点 _c('',{}....)
      // 如果区分是组件还是元素节点？  
      if (!isReservedTag(tag)) {
        let Ctor = vm.$options.components[tag]; // 组件的初始化 就是new 组件的构造函数

        return createComponent$1(vm, tag, data, children, data.key, Ctor);
      }

      return vnode(vm, tag, data, children, data.key, undefined);
    }
    function createText(vm, text) {
      // 返回虚拟节点
      return vnode(vm, undefined, undefined, undefined, undefined, text);
    } // 看两个节点是不是相同节点，就看是不是 tag 和 key都一样
    // vue2 就有一个性能问题 ， 递归比对

    function isSameVnode(newVnode, oldVnode) {
      return newVnode.tag === oldVnode.tag && newVnode.key == oldVnode.key;
    }

    function vnode(vm, tag, data, children, key, text, options) {
      return {
        vm,
        tag,
        data,
        children,
        key,
        text,
        componentOptions: options
      };
    }

    function patch(oldVnode, vnode) {
      if (!oldVnode) {
        // 组件的挂载流程 
        return createElm(vnode); // 产生一个组件的真实节点
      }

      const isRealElement = oldVnode.nodeType;

      if (isRealElement) {
        // 删除老节点 根据vnode创建新节点，替换掉老节点
        const elm = createElm(vnode);
        const parentNode = oldVnode.parentNode;
        parentNode.insertBefore(elm, oldVnode.nextSibling);
        parentNode.removeChild(oldVnode);
        return elm; // 返回最新节点
      } else {
        // 不管怎么diff 最终想更新渲染 =》 dom操作里去
        // 只比较同级，如果不一样，儿子就不用比对了， 根据当前节点，创建儿子 全部替换掉 
        // diff 算法如何实现？
        if (!isSameVnode(oldVnode, vnode)) {
          // 如果新旧节点 不是同一个，删除老的换成新的
          return oldVnode.el.parentNode.replaceChild(createElm(vnode), oldVnode.el);
        } // 文本直接更新即可，因为文本没有儿子


        let el = vnode.el = oldVnode.el; // 复用节点

        if (!oldVnode.tag) {
          // 文本了, 一个是文本 那么另一个一定也是文本
          if (oldVnode.text !== vnode.text) {
            return el.textContent = vnode.text;
          }
        } // 元素  新的虚拟节点


        updateProperties(vnode, oldVnode.data); // 是相同节点了，复用节点，在更新不一样的地方 （属性）
        // 比较儿子节点

        let oldChildren = oldVnode.children || [];
        let newChildren = vnode.children || []; // 情况1 ：老的有儿子 ， 新没儿子

        if (oldChildren.length > 0 && newChildren.length == 0) {
          el.innerHTML = ''; // 新的有儿子 老的没儿子 直接将新的插入即可
        } else if (newChildren.length > 0 && oldChildren.length == 0) {
          newChildren.forEach(child => el.appendChild(createElm(child)));
        } else {
          // 新老都有儿子
          updateChildren(el, oldChildren, newChildren);
        }

        return el;
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

      function makeKeyByIndex(children) {
        let map = {};
        children.forEach((item, index) => {
          map[item.key] = index;
        });
        return map;
      }

      let mapping = makeKeyByIndex(oldChildren); // diff算法的复杂度 是O(n)  比对的时候 指针交叉的时候 就是比对完成了

      while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        if (!oldStartVnode) {
          // 在指针移动的时候 可能元素已经被移动走了，那就跳过这一项
          oldStartVnode = oldChildren[++oldStartIndex];
        } else if (!oldEndVnode) {
          oldEndVnode = oldChildren[--oldEndIndex];
        } else if (isSameVnode(oldStartVnode, newStartVnode)) {
          // 头头比较
          patch(oldStartVnode, newStartVnode); // 会递归比较子节点，同时比对这两个人的差异

          oldStartVnode = oldChildren[++oldStartIndex];
          newStartVnode = newChildren[++newStartIndex];
        } else if (isSameVnode(oldEndVnode, newEndVnode)) {
          // 尾尾比较
          patch(oldEndVnode, newEndVnode);
          oldEndVnode = oldChildren[--oldEndIndex];
          newEndVnode = newChildren[--newEndIndex];
        } else if (isSameVnode(oldStartVnode, newEndVnode)) {
          // 头尾
          patch(oldStartVnode, newEndVnode);
          el.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling);
          oldStartVnode = oldChildren[++oldStartIndex];
          newEndVnode = newChildren[--newEndIndex];
        } else if (isSameVnode(oldEndVnode, newStartVnode)) {
          // 尾头
          patch(oldEndVnode, newStartVnode);
          el.insertBefore(oldEndVnode.el, oldStartVnode.el); // 将尾部的插入到头部去

          oldEndVnode = oldChildren[--oldEndIndex];
          newStartVnode = newChildren[++newStartIndex];
        } else {
          // 之前的逻辑都是考虑 用户一些特殊情况，但是有非特殊的，乱序排
          let moveIndex = mapping[newStartVnode.key];

          if (moveIndex == undefined) {
            // 没有直接将节点插入到开头的前面
            el.insertBefore(createElm(newStartVnode), oldStartVnode.el);
          } else {
            // 有的话需要复用
            let moveVnode = oldChildren[moveIndex]; // 找到复用的那个人，将他移动到前面去

            patch(moveVnode, newStartVnode);
            el.insertBefore(moveVnode.el, oldStartVnode.el);
            oldChildren[moveIndex] = undefined; // 将移动的节点标记为空
          }

          newStartVnode = newChildren[++newStartIndex];
        }
      }

      if (newStartIndex <= newEndIndex) {
        // 新的多，那么就将多的插入进去即可
        // 如果下一个是null 就是appendChild
        let anchor = newChildren[newEndIndex + 1] == null ? null : newChildren[newEndIndex + 1].el; // 参照物是固定的

        for (let i = newStartIndex; i <= newEndIndex; i++) {
          // 看一下 当前尾节点的下一个元素是否存在，如果存在则是插入到下一个元素的前面
          // 这里可能是向前追加 可能是像后追加
          el.insertBefore(createElm(newChildren[i]), anchor);
        }
      }

      if (oldStartIndex <= oldEndIndex) {
        // 老的多余的  ,需要清理掉，直接删除即可
        for (let i = oldStartIndex; i <= oldEndIndex; i++) {
          let child = oldChildren[i]; // 因为child可能是undefined 所有要跳过空间点

          child && el.removeChild(child.el);
        }
      }
    }

    function createComponent(vnode) {
      // 给组件预留了 一个初始化流程 init
      let i = vnode.data;

      if ((i = i.hook) && (i = i.init)) {
        i(vnode);
      }

      if (vnode.componentInstance) {
        // 说明是组件
        return true;
      }
    }

    function createElm(vnode) {
      let {
        tag,
        data,
        children,
        text,
        vm
      } = vnode;

      if (typeof tag === 'string') {
        if (createComponent(vnode)) {
          // 返回一个组件的真实节点
          return vnode.componentInstance.$el; // 对应的就是真实节点
        }

        vnode.el = document.createElement(tag); // 先创建id app

        updateProperties(vnode);
        children.forEach(child => {
          // 在去查找id app的儿子，对儿子进行创建 {tag:'组件',componentOpions}
          vnode.el.appendChild(createElm(child)); // createElm(child) 有创建有创建组件和元素的功能
        });
      } else {
        vnode.el = document.createTextNode(text);
      }

      return vnode.el;
    }

    function updateProperties(vnode, oldProps = {}) {
      // 这里的逻辑 可能是初次渲染，初次渲染 直接 用oldProps 给vnode的el赋值即可
      // 更新逻辑 拿到老的props 和 vnode里面的data进行比对
      let el = vnode.el; // dom真实的节点

      let newProps = vnode.data || {}; // 新旧比对， 两个对象如何比对差异？

      let newStyle = newProps.style || {};
      let oldStyle = oldProps.style || {};

      for (let key in oldStyle) {
        // 老的样式有 新的没有，就把页面上的样式删除掉
        if (!newStyle[key]) {
          el.style[key] = '';
        }
      }

      for (let key in newProps) {
        //  直接用新的改掉老的就可以了
        // 如果前后一样，浏览器会去检测
        if (key == 'style') {
          for (let key in newStyle) {
            // {style:{color:red}}
            el.style[key] = newStyle[key];
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

    function mountComponent(vm) {
      // 初始化流程
      let updateComponent = () => {
        vm._update(vm._render()); // render()  _c _v _s

      };

      callHook(vm, 'beforeCreate');
      new Watcher(vm, updateComponent, () => {
        console.log('后续增添更新钩子函数 update');
        callHook(vm, 'created');
      }, true);
      callHook(vm, 'mounted');
    }
    function lifeCycleMixin(Vue) {
      Vue.prototype._update = function (vnode) {
        const vm = this;
        let preVnode = vm._prevVnode; // 第一次渲染 是根据虚拟节点 生成真实节点，替换掉原来的节点

        vm._prevVnode = vnode; // 如果是第二次 生成一个新得虚拟节点 ，和老的虚拟节点进行对比

        if (!preVnode) {
          // 没有节点就是初次渲染
          vm.$el = patch(vm.$el, vnode);
        } else {
          vm.$el = patch(preVnode, vnode);
        }
      };
    }
    function callHook(vm, hook) {
      let handlers = vm.$options[hook];
      handlers && handlers.forEach(fn => {
        fn.call(vm);
      });
    }

    let oldArrayPrototype = Array.prototype; // 获取数组的老的原型方法

    let arrayMethods = Object.create(oldArrayPrototype); // 让arrayMethods 通过__proto__ 能获取到数组的方法
    // arrayMethods.__proto__ == oldArrayPrototype
    // arrayMethods.push = function

    let methods = [// 只有这七个方法 可以导致数组发生变化
    'push', 'shift', 'pop', 'unshift', 'reverse', 'sort', 'splice'];
    methods.forEach(method => {
      arrayMethods[method] = function (...args) {
        // 数组新增的属性 要看一下是不是对象，如果是对象 继续进行劫持
        // 需要调用数组原生逻辑
        oldArrayPrototype[method].call(this, ...args); // todo... 可以添加自己逻辑 函数劫持 切片

        let inserted = null;
        let ob = this.__ob__;

        switch (method) {
          case 'splice':
            // 修改 删除  添加  arr.splice(0,0,100,200,300)
            inserted = args.slice(2); // splice方法从第三个参数起 是增添的新数据

            break;

          case 'push':
          case 'unshift':
            inserted = args; // 调用push 和 unshift 传递的参数就是新增的逻辑

            break;
        } // inserted[] 遍历数组 看一下它是否需要进行劫持


        if (inserted) ob.observeArray(inserted);
        ob.dep.notify(); // 触发页面更新流程
      };
    }); // 属性的查找：是先找自己身上的，找不到去原型上查找

    // 2.每个原型上都有一个constructor属性 指向 函数本身 Function.prototype.constrcutr = Function

    class Observer {
      constructor(value) {
        // 不让__ob__ 被遍历到
        // value.__ob__ = this; // 我给对象和数组添加一个自定义属性
        // 如果给一个对象增添一个不存在的属性，我希望也能更新视图 
        this.dep = new Dep(); // 给对象 和 数组都增加dep属性  {}.__ob__.dep  [].__ob__.dep

        Object.defineProperty(value, '__ob__', {
          value: this,
          enumerable: false // 标识这个属性不能被列举出来，不能被循环到

        });

        if (isArray(value)) {
          // 更改数组原型方法, 如果是数组 我就改写数组的原型链
          value.__proto__ = arrayMethods; // 重写数组的方法

          this.observeArray(value); // 数组 如何依赖收集 ， 而且数组更新的时候 如何触发更新?  [].push .pop...
        } else {
          this.walk(value); // 核心就是循环对象
        }
      }

      observeArray(data) {
        // 递归遍历数组，对数组内部的对象再次重写 [[]]  [{}]
        // vm.arr[0].a = 100;
        // vm.arr[0] = 100;
        data.forEach(item => observe(item)); // 数组里面如果是引用类型那么是响应式的
      }

      walk(data) {
        Object.keys(data).forEach(key => {
          // 要使用defineProperty重新定义
          defineReactive(data, key, data[key]);
        });
      }

    } // vue2 应用了defineProperty需要一加载的时候 就进行递归操作，所以好性能，如果层次过深也会浪费性能
    // 1.性能优化的原则：
    // 1) 不要把所有的数据都放在data中，因为所有的数据都会增加get和set
    // 2) 不要写数据的时候 层次过深， 尽量扁平化数据 
    // 3) 不要频繁获取数据
    // 4) 如果数据不需要响应式 可以使用Object.freeze 冻结属性 


    function dependArray(value) {
      // [[[]],{}]  让数组里的引用类型都收集依赖
      for (let i = 0; i < value.length; i++) {
        let current = value[i];
        current.__ob__ && current.__ob__.dep.depend();

        if (Array.isArray(current)) {
          dependArray(current);
        }
      }
    }

    function defineReactive(obj, key, value) {
      // vue2 慢的原因 主要在这个方法中
      let childOb = observe(value); // 递归进行观测数据，不管有多少层 我都进行defineProperty
      // childOb 如果有值 那么就是数组或者对象
      // 数组的dep

      let dep = new Dep(); // 每个属性都增加了一个dep 闭包

      Object.defineProperty(obj, key, {
        get() {
          // 后续会有很多逻辑
          if (Dep.target) {
            // watcher
            dep.depend();

            if (childOb) {
              // 取属性的时候 会对对应的值（对象本身和数组）进行依赖收集
              childOb.dep.depend(); // 让数组和对象也记住当前的watcher

              if (Array.isArray(value)) {
                // 可能是数组套数组的可能
                dependArray(value);
              }
            }
          }

          return value; // 闭包，次此value 会像上层的value进行查找
        },

        // 一个属性可能对应多个watcher， 数组也有更新
        set(newValue) {
          // 如果设置的是一个对象那么会再次进行劫持
          if (newValue === value) return;
          observe(newValue);
          value = newValue;
          dep.notify(); // 拿到当前的dep里面的watcher依次执行
        }

      });
    }

    function observe(value) {
      // 1.如果value不是对象，那么就不用观测了，说明写的有问题
      if (!isObject(value)) {
        return;
      }

      if (value.__ob__) {
        return; // 一个对象不需要重新被观测
      } // 需要对对象进行观测 （最外层必须是一个{} 不能是数组）
      // 如果一个数据已经被观测过了 ，就不要在进行观测了， 用类来实现，我观测过就增加一个标识 说明观测过了，在观测的时候 可以先检测是否观测过，如果观测过了就跳过检测


      return new Observer(value);
    } // 1.默认vue在初始化的时候 会对对象每一个属性都进行劫持，增加dep属性， 当取值的时候会做依赖收集
    // 2.默认还会对属性值是（对象和数组的本身进行增加dep属性） 进行依赖收集
    // 3.如果是属性变化 触发属性对应的dep去更新
    // 4.如果是数组更新，触发数组的本身的dep 进行更新
    // 5.如果取值的时候是数组还要让数组中的对象类型也进行依赖收集 （递归依赖收集）
    // 6.如果数组里面放对象，默认对象里的属性是会进行依赖收集的，因为在取值时 会进行JSON.stringify操作

    function initState(vm) {
      const opts = vm.$options;

      if (opts.data) {
        initData(vm);
      }
    }

    function proxy(vm, key, source) {
      Object.defineProperty(vm, key, {
        get() {
          return vm[source][key];
        },

        set(newValue) {
          vm[source][key] = newValue;
        }

      });
    }

    function initData(vm) {
      let data = vm.$options.data;
      data = vm._data = isFunction(data) ? data.call(vm) : data;
      observe(data);

      for (let key in data) {
        proxy(vm, key, '_data');
      }
    }

    function initMixin(Vue) {
      Vue.prototype._init = function (options) {
        const vm = this; // 因为全局定义的内容 会混合在当前的实例上

        vm.$options = mergeOptions(vm.constructor.options, options);
        console.log(vm.$options);
        initState(vm);

        if (vm.$options.el) {
          vm.$mount(vm.$options.el);
        }
      };

      Vue.prototype.$mount = function (el) {
        debugger;
        const vm = this;
        const opts = vm.$options;
        el = document.querySelector(el);
        vm.$el = el;

        if (!opts.render) {
          let template = opts.template; // 取组件的template

          if (!template) {
            template = el.outerHTML;
          }

          let render = compileToFunction(template);
          opts.render = render;
        }

        mountComponent(vm);
      };

      Vue.prototype.$nextTick = nextTick;
    }

    function renderMixin(Vue) {
      Vue.prototype._c = function () {
        // createElement 创建元素型的节点
        const vm = this;
        return createElement(vm, ...arguments);
      };

      Vue.prototype._v = function (text) {
        // 创建文本的虚拟节点
        const vm = this;
        return createText(vm, text); // 描述虚拟节点是属于哪个实例的
      };

      Vue.prototype._s = function (val) {
        // JSON.stingfiy()
        if (isObject(val)) return JSON.stringify(val);
        return val;
      };

      Vue.prototype._render = function () {
        const vm = this; // vm中有所有的数据 vm.xxx => vm._data.xxx

        let {
          render
        } = vm.$options;
        let vnode = render.call(vm);
        return vnode;
      };
    }

    function Vue(options) {
      this._init(options);
    }

    initMixin(Vue);
    renderMixin(Vue);
    lifeCycleMixin(Vue);
    initGlobalAPI(Vue);
    // 2.组件初始化的时候，会做一个合并mergeOptions (自己的组件.__proto__ = 全局的组件)
    // 3.内部会对模板进行编译操作 _c('组件的名字') 做筛查如果是组件就创造一个组件的虚拟节点 , 还会判断Ctor 如果是对象会调用Vue.extend, 所有的组件都是通过Vue.extend 方法来实现的(componentOptions 里面放着组件的所有内容 属性的实现，事件的实现，插槽的内容，Ctor)
    // 4.创建组件的真实节点 ( new Ctor 拿到组件的实例 ，并且调用组件的$mount方法 （会生成一个$el 对应组件模板渲染后的结果）)  vnode.componentInstance = new Ctor()  vnode.componentInstance.$el => 组件渲染后结果
    // 5.将组件的vnode.componentInstance.$el 插入到父标签中
    // 6. 组件在 new Ctor()时 会进行组件的初始化，给组件再次添加一个独立的渲染watcher (每个组件都有自己的watcher)，更新时 只需要更新自己组件对应的渲染watcher （因为组件渲染时 组件对应的属性会收集自己的渲染watcher）
    // 下次讲下根据源码调试源代码，调试组件创建流程、异步组件的实现原理、组件通信原理 及 keep-alive 原理

    return Vue;

})));
//# sourceMappingURL=vue.js.map
