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
        console.log('update'); // 可以做异步更新处理

        this.get();
      }

    }

    function patch(el, vnode) {
      // 删除老节点 根据vnode创建新节点，替换掉老节点
      const elm = createElm(vnode); // 根据虚拟节点创造了真实节点

      const parentNode = el.parentNode;
      parentNode.insertBefore(elm, el.nextSibling); // el.nextSibling 不存在就是null 如果为null insertBefore就是appendChild

      parentNode.removeChild(el);
      return elm; // 返回最新节点
    } // 面试有问 虚拟节点的实现 -》 如何将虚拟节点渲染成真实节点

    function createElm(vnode) {
      let {
        tag,
        data,
        children,
        text,
        vm
      } = vnode; // 我们让虚拟节点和真实节点做一个映射关系, 后续某个虚拟节点更新了 我可以跟踪到真实节点，并且更新真实节点

      if (typeof tag === 'string') {
        vnode.el = document.createElement(tag); // 如果有data属性，我们需要把data设置到元素上

        updateProperties(vnode.el, data);
        children.forEach(child => {
          vnode.el.appendChild(createElm(child));
        });
      } else {
        vnode.el = document.createTextNode(text);
      }

      return vnode.el;
    }

    function updateProperties(el, props = {}) {
      // 后续写diff算法的时候 在进行完善, 没有考虑样式等
      for (let key in props) {
        el.setAttribute(key, props[key]);
      }
    }

    function mountComponent(vm) {
      // 初始化流程
      let updateComponent = () => {
        vm._update(vm._render()); // render()  _c _v _s

      }; // 每个组件都有一个watcher，我们把这个watcher称之为渲染watcher


      new Watcher(vm, updateComponent, () => {
        console.log('后续增添更新钩子函数 update');
      }, true); // updateComponent()
    }
    function lifeCycleMixin(Vue) {
      Vue.prototype._update = function (vnode) {
        // 采用的是 先序深度遍历 创建节点 （遇到节点就创造节点，递归创建）
        const vm = this;
        vm.$el = patch(vm.$el, vnode);
      };
    }

    function isFunction(val) {
      return typeof val == 'function';
    }
    function isObject(val) {
      return typeof val == 'object' && val !== null;
    }
    let isArray = Array.isArray;

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
      };
    }); // 属性的查找：是先找自己身上的，找不到去原型上查找

    // 2.每个原型上都有一个constructor属性 指向 函数本身 Function.prototype.constrcutr = Function

    class Observer {
      constructor(value) {
        // 不让__ob__ 被遍历到
        // value.__ob__ = this; // 我给对象和数组添加一个自定义属性
        Object.defineProperty(value, '__ob__', {
          value: this,
          enumerable: false // 标识这个属性不能被列举出来，不能被循环到

        });

        if (isArray(value)) {
          // 更改数组原型方法, 如果是数组 我就改写数组的原型链
          value.__proto__ = arrayMethods; // 重写数组的方法

          this.observeArray(value);
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


    function defineReactive(obj, key, value) {
      // vue2 慢的原因 主要在这个方法中
      observe(value); // 递归进行观测数据，不管有多少层 我都进行defineProperty

      let dep = new Dep(); // 每个属性都增加了一个dep

      Object.defineProperty(obj, key, {
        get() {
          // 后续会有很多逻辑
          if (Dep.target) {
            // watcher
            dep.depend();
          }

          return value; // 闭包，次此value 会像上层的value进行查找
        },

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
    }

    function initState(vm) {
      const opts = vm.$options;

      if (opts.data) {
        initData(vm);
      }
    }

    function proxy(vm, key, source) {
      // 取值的时候做代理，不是暴力的把_data 属性赋予给vm, 而且直接赋值会有命名冲突问题
      Object.defineProperty(vm, key, {
        get() {
          // ?
          return vm[source][key]; // vm._data.message 
        },

        set(newValue) {
          // ?
          vm[source][key] = newValue; // vm._data.message = newValue
        }

      });
    }

    function initData(vm) {
      let data = vm.$options.data; // 用户传入的数据
      // 如果用户传递的是一个函数 则取函数的返回值作为对象 ， 如果就是对象那就直接使用这个对象
      // 只有根实例可以data是一个对象
      // data 和 vm._data 引用的是同一个人 -》 data被劫持了  vm._data也被劫持

      data = vm._data = isFunction(data) ? data.call(vm) : data; // _data 已经是响应式的了
      // 需要将data变成响应式的 Object.defineProperty， 重写data中的所有属性

      observe(data); // 观测对象中的属性

      for (let key in data) {
        // vm.message => vm._data.message
        proxy(vm, key, '_data'); // 代理vm上的取值和设置值 和  vm._data 没关系了
      }
    }

    function initMixin(Vue) {
      // 后续组件化开发的时候  Vue.extend 可以创造一个子组件，子组件可以继承Vue，子组件也可以调用_init方法
      Vue.prototype._init = function (options) {
        const vm = this; // 把用户的选项放到 vm上，这样在其他方法中都可以获取到options 了 

        vm.$options = options; // 为了后续扩展的方法 都可以获取$options选项
        // options中是用户传入的数据 el , data

        initState(vm);

        if (vm.$options.el) {
          // 要将数据挂载到页面上
          // 现在数据已经被劫持了， 数据变化需要更新视图 diff算法更新需要更新的部分 
          // vue -> template（写起来更符合直觉） -> jsx （灵活）
          // vue3 template 写起来性能会更高一些 内部做了很多优化
          // template -> ast语法树（用来描述语法的，描述语法本身的） -> 描述成一个树结构 ->  将代码重组成js语法
          // 模板编译原理 （把template模板编译成render函数-》 虚拟DOM -》 diff算法比对虚拟DOM）
          // ast -> render返回 -> vnode -> 生成真实dom 
          //      更新的时候再次调用render -> 新的vnode  -> 新旧比对 -> 更新真实dom
          vm.$mount(vm.$options.el);
        }
      }; // new Vue({el}) new Vue().$mount


      Vue.prototype.$mount = function (el) {
        const vm = this;
        const opts = vm.$options;
        el = document.querySelector(el); // 获取真实的元素

        vm.$el = el; // 页面真实元素

        if (!opts.render) {
          // 模板编译
          let template = opts.template;

          if (!template) {
            template = el.outerHTML;
          }

          let render = compileToFunction(template);
          opts.render = render;
        } //  这里已经获取到了，一个render函数的了，这个函数它的返回值 _c('div',{id:'app'},_c('span',undefined,'hello'))


        mountComponent(vm);
      };
    }

    function createElement(vm, tag, data = {}, ...children) {
      // 返回虚拟节点 _c('',{}....)
      return vnode(vm, tag, data, children, data.key, undefined);
    }
    function createText(vm, text) {
      // 返回虚拟节点
      return vnode(vm, undefined, undefined, undefined, undefined, text);
    }

    function vnode(vm, tag, data, children, key, text) {
      return {
        vm,
        tag,
        data,
        children,
        key,
        text
      };
    } // vnode 其实就是一个对象 用来描述节点的，这个和ast长的很像啊？
    // ast 描述语法的，他并没有用户自己的逻辑 , 只有语法解析出来的内容
    // vnode 他是描述dom结构的 可以自己去扩展属性

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
      this._init(options); // 实现vue的初始化功能

    }

    initMixin(Vue);
    renderMixin(Vue);
    lifeCycleMixin(Vue); // 导出vue给别人使用
    // 1.vue里面用到了观察者模式，默认组件渲染的时候 ， 会创建一个watcher，（并且会渲染视图）
    // 2.当渲染视图的时候，会取data中的数据， 会走每个属性的get方法， 就让这个属性的dep记录watcher
    // 3.同时让watcher也记住dep （这个逻辑目前没用到）   dep和watcher是多对多的关系，因为一个属性可能对应多个视图，一个视图对应多个数据
    // 4.如果数据发生变化，会通知对应属性的dep，依次通知存放的watcher去更新

    return Vue;

})));
//# sourceMappingURL=vue.js.map
