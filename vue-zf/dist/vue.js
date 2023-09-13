(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

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
        let match;

        // ，每次匹配的时候 lastIndex 会自动向后移动
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
    }

    // _c(div,{},c1,c2,c3,c4)
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
      let root = null;
      // 我要构建父子关系
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
        }
        // 文本
        if (index > 0) {
          // 文本
          let chars = html.substring(0, index); //<div></div>
          text(chars);
          advance(chars.length);
        }
      }
      return root;
    }

    // const str = parserHTML('<div id="app">hello wolrd <span>hello</span></div>')

    // console.log(str)

    //  <div id="app">hello wolrd <span>hello</span></div> */}

    function compileToFunction(template) {
      // 1.将模板变成ast语法树
      let ast = parserHTML(template);

      // 代码优化 标记静态节点

      // 2.代码生成
      let code = generate(ast);
      let render = new Function(`with(this){return ${code}}`);
      console.log(render.toString());
      return render;

      // 1.编译原理
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
    let isArray = Array.isArray;
    let callbacks = [];
    let waiting = false;
    function flushCallbacks() {
      callbacks.forEach(fn => fn());
      callbacks = [];
      waiting = false;
    }

    // 微任务是在页面渲染前执行 我取的是内存中的dom, 不关心你渲染完毕没有
    function nextTick(fn) {
      callbacks.push(fn);
      if (!waiting) {
        Promise.resolve().then(flushCallbacks);
        waiting = true;
      }
    }
    let lifeCycleHooks = ['beforeCreate', 'created', 'beforeMount', 'mounted', 'beforeUpdate', 'updated', 'beforeDestroy', 'destroyed'];
    let strats = {};
    function mergeHook(parentVal, childVal) {
      if (childVal) {
        if (parentVal) {
          return parentVal.concat(childVal);
        } else {
          return [childVal];
        }
      } else {
        return parentVal;
      }
    }
    lifeCycleHooks.forEach(hook => {
      strats[hook] = mergeHook;
    });
    strats.components = function (parentVal, childVal) {
      // Vue.options.components
      let options = Object.create(parentVal); // 根据父对象构造一个新对象 options._proto_ = parentVal
      if (childVal) {
        for (let key in childVal) {
          options[key] = childVal[key];
        }
      }
      return options;
    };
    function mergeOptions(parent, child) {
      const options = {};
      for (let key in parent) {
        mergeField(key);
      }
      for (let key in child) {
        if (parent.hasOwnProperty(key)) {
          continue;
        }
        mergeField(key);
      }
      function mergeField(key) {
        const parentVal = parent[key];
        const childVal = child[key];
        if (strats[key]) {
          options[key] = strats[key](parentVal, childVal);
        } else {
          if (isObject(parentVal) && isObject(childVal)) {
            options[key] = {
              ...parentVal,
              ...childVal
            };
          } else {
            options[key] = child[key] || parent[key];
          }
        }
      }
      return options;
    }
    function isReservedTag(str) {
      let reservedTag = 'a,div,span,p,img,button,ul,li';
      return reservedTag.includes(str);
    }

    let oldArrayPrototype = Array.prototype; // 获取数组的老的原型方法
    let arrayMethods = Object.create(oldArrayPrototype); // 让arrayMethods 通过__proto__ 能获取到数组的方法
    // arrayMethods.__proto__ == oldArrayPrototype
    // arrayMethods.push = function
    let methods = [
    // 只有这七个方法 可以导致数组发生变化
    'push', 'shift', 'pop', 'unshift', 'reverse', 'sort', 'splice'];
    methods.forEach(method => {
      arrayMethods[method] = function (...args) {
        // 数组新增的属性 要看一下是不是对象，如果是对象 继续进行劫持
        // 需要调用数组原生逻辑
        oldArrayPrototype[method].call(this, ...args);
        // todo... 可以添加自己逻辑 函数劫持 切片
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
        }
        // inserted[] 遍历数组 看一下它是否需要进行劫持
        if (inserted) ob.observeArray(inserted);
        ob.dep.notify(); // 触发页面更新流程
      };
    });

    // 属性的查找：是先找自己身上的，找不到去原型上查找

    let id$1 = 0;
    /*
      多对多的关系
      dep.subs = [watcher]
      watcher.deps = [dep]
    */

    class Dep {
      constructor() {
        // 要把 watcher 放到 dep 中
        this.subs = [];
        this.id = id$1++;
      }
      depend() {
        // 要给watcher 也加一个标识 防止重复
        // this.subs.push(Dep.target)
        // 让 dep 记住这个 watcher ,watcher 还要记住 dep 相互的关系
        if (Dep.target) {
          Dep.target.addDep(this); // 在 watcher 中在条用 dep 的 addSub 方法
        }
      }

      addSub(watcher) {
        this.subs.push(watcher);
      }
      notify() {
        this.subs.forEach(watcher => watcher.update());
      }
    }
    Dep.target = null; // 这里我用了一个全局的变量 window.target 静态属性

    let stack = [];
    function pushTarget(watcher) {
      Dep.target = watcher;
      stack.push(watcher);
      console.log(stack);
    }
    function popTarget() {
      stack.pop();
      Dep.target = stack[stack.length - 1];
    }

    // 1.每个对象都有一个__proto__属性 它指向所属类的原型   fn.__proto__ = Function.prototype
    // 2.每个原型上都有一个constructor属性 指向 函数本身 Function.prototype.constrcutr = Function
    class Observer {
      constructor(value) {
        // 不让__ob__ 被遍历到
        // value.__ob__ = this; // 我给对象和数组添加一个自定义属性

        // 如果给一个对象增加一个不存在的属性，我希望也能更新视图
        this.dep = new Dep(); // 给对象和数组都增加dep 属性 {}.__ob__.ep  [].__ob__.dep
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
    }
    // vue2 应用了defineProperty需要一加载的时候 就进行递归操作，所以好性能，如果层次过深也会浪费性能
    // 1.性能优化的原则：
    // 1) 不要把所有的数据都放在data中，因为所有的数据都会增加get和set
    // 2) 不要写数据的时候 层次过深， 尽量扁平化数据
    // 3) 不要频繁获取数据
    // 4) 如果数据不需要响应式 可以使用Object.freeze 冻结属性
    function dependArray(value) {
      // [[[]], {}] 让数组的引用类型都收集依赖
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

      // chilOb 如果有值 那么就是数组 或者对象

      let dep = new Dep(); // 每个属性都增加了一个 dep 闭包

      Object.defineProperty(obj, key, {
        get() {
          // 后续会有很多逻辑
          if (Dep.target) {
            dep.depend();
            if (childOb) {
              // 去属性的时候 会对对应的值（对象本身和数组）进行依赖收集
              childOb.dep.depend(); // 让数组和对象也记住当前的 watcher
              if (isArray(value)) {
                // 可能是数组套数组的功能
                dependArray(value);
              }
            }
          }
          console.log(key, 'get');
          return value; // 闭包，次此value 会像上层的value进行查找
        },

        set(newValue) {
          // 如果设置的是一个对象那么会再次进行劫持
          if (newValue === value) return;
          observe(newValue);
          console.log('修改');
          value = newValue;
          dep.notify(); // 拿到当前的 dep 里面的 watcher 依次执行
        }
      });
    }

    function observe(value) {
      // 1.如果value不是对象，那么就不用观测了，说明写的有问题
      if (!isObject(value)) {
        return;
      }
      if (value.__ob__) {
        return value.__ob__; // 一个对象不需要重新被观测
      }
      // 需要对对象进行观测 （最外层必须是一个{} 不能是数组）

      // 如果一个数据已经被观测过了 ，就不要在进行观测了， 用类来实现，我观测过就增加一个标识 说明观测过了，在观测的时候 可以先检测是否观测过，如果观测过了就跳过检测
      return new Observer(value);
    }

    let queue = []; // 存放要更新的 watcher
    let has = {};
    function flushSchedulerQueue() {
      // beforeUpadte
      queue.forEach(watcher => watcher.run());
      queue = [];
      has = {};
      pending = false;
    }
    let pending = false;
    function queueWatcher(watcher) {
      let id = watcher.id;
      if (has[id] == null) {
        has[id] = true;
        queue.push(watcher);
        if (!pending) {
          nextTick(flushSchedulerQueue);
          pending = true;
        }
      }
    }

    let id = 0;
    class Watcher {
      constructor(vm, exprOrFn, cb, options) {
        this.vm = vm;
        this.exprOrFn = exprOrFn;
        this.cb = cb;
        this.user = !!options.user; // 是不是用户watcher
        this.lazy = !!options.lazy;
        this.dirty = options.lazy; // 如果是计算属性，那么默认值lazy: true dirty: true
        this.options = options;
        this.id = id++;
        this.depsId = new Set();
        this.deps = [];
        if (typeof exprOrFn === 'string') {
          this.getter = function () {
            // 当数据取值时，会进行依赖收集
            // age.n vm['age.n'] => vm['age']['n']
            let path = exprOrFn.split('.');
            let obj = vm;
            for (let i = 0; i < path.length; i++) {
              obj = obj[path[i]];
            }
            return obj; // getter 方法
          };
        } else {
          this.getter = exprOrFn; // exprOrFn 就是页面渲染逻辑
        }
        // this.get() // 表示上来后就做一次初始化
        // 第一次的 value
        this.value = this.lazy ? undefined : this.get(); // 默认初始化 要取值
      }

      addDep(dep) {
        let did = dep.id;
        if (!this.depsId.has(did)) {
          this.depsId.add(did);
          this.deps.push(dep); // 做了保存 id 的功能 并且让 watcher 记住 dep
          dep.addSub(this);
        }
      }
      get() {
        // Dep.target = this // Dep.target = watcher
        pushTarget(this);
        const value = this.getter.call(this.vm);
        // this.getter() // 页面的渲染的逻辑 vm.name / vm.age render() 方法会去 vm 上取值 vm._update(vm._render)
        // Dep.target = null // 渲染完毕后 就将标识清空了，只有在渲染的时候才会进行依赖收集
        popTarget();
        return value;
      }
      update() {
        // 每次更新数据都会同步调用这个 update 方法，可以将更新的逻辑缓存起来，等会同步更新数据的逻辑执行完毕后，依次调用（去重的逻辑）
        console.log('缓存更新');
        if (this.lazy) {
          this.dirty = true;
        } else {
          queueWatcher(this); // 多次调用 update 希望将watcher 缓存起来，等下一会一起更新
        }
        // 可以做异步更新处理
        // this.get()
      }

      run() {
        console.log('真正执行更新');
        //this.get() // render()  取最新的 vm 上的数据
        let newValue = this.get();
        let oldValue = this.value;
        this.value = newValue; // 为了保证下一次更新时 上一次的最新值是下一次的老值
        if (this.user) {
          this.cb.call(this.vm, newValue, oldValue);
        }
      }
      evaluate() {
        this.dirty = false; // 为 fasle 表示已经取过值了
        this.value = this.get(); // 用户的 getter 执行
      }

      depend() {
        let i = this.deps.length;
        while (i--) {
          this.deps[i].depend(); // lastName firstName 收集渲染 watcher
        }
      }
    }

    function stateMixin(Vue) {
      Vue.prototype.$watch = function (key, handler, options = {}) {
        options.user = true; // 是一个用户自己写 的 watcher

        new Watcher(this, key, handler, options);
      };
    }
    function initState(vm) {
      const opts = vm.$options;
      if (opts.data) {
        initData(vm);
      }
      if (opts.computed) {
        initComputed(vm, opts.computed);
      }
      if (opts.watch) {
        initWatch(vm, opts.watch);
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

    function initWatch(vm, watch) {
      for (let key in watch) {
        let handler = watch[key];
        if (isArray(handler)) {
          for (let i = 0; i < handler.length; i++) {
            createWatcher(vm, key, handler[i]);
          }
        } else {
          createWatcher(vm, key, handler);
        }
      }
    }
    function createWatcher(vm, key, handler) {
      return vm.$watch(key, handler);
    }
    function initComputed(vm, computed) {
      const watchers = vm._computedWatchers = {};
      for (let key in computed) {
        const userDef = computed[key];
        // 依赖的属性变化就重新取值 get
        let getter = typeof userDef === 'function' ? userDef : userDef.get;

        // 计算属性本质就是 watcher
        // 将 watcher 和属性 做一个映射
        watchers[key] = new Watcher(vm, getter, () => {}, {
          lazy: true // 默认不执行
        });

        // 将 key 定义在 vm 上
        defineComputed(vm, key, userDef);
      }
    }
    function createComputedGetter(key) {
      return function computedGetter() {
        // 取计算属性 走的是这个函数
        // this._computedWatchers 包含着所有的计算属性
        // 通过 key 可以拿到对应的watcher, 这个watcher 中包含了 getter
        let watcher = this._computedWatchers[key];

        // 脏就是 要调用用户的 getter 不脏就是不要调用 getter
        if (watcher.dirty) {
          watcher.evaluate();
        }

        // 如果当前取完值后 Dep.target 还有值 需要继续向上收集
        if (Dep.target) {
          // 计算属性 watcher 内部有两个dep, firsteName lastName
          watcher.depend(); // watcher 里对应了 多个dep
        }

        return watcher.value;
      };
    }
    function defineComputed(vm, key, userDef) {
      let sharedProperty = {};
      if (typeof userDef === 'function') {
        sharedProperty.get = userDef;
      } else {
        sharedProperty.get = createComputedGetter(key);
        sharedProperty.set = userDef.set;
      }
      Object.defineProperty(vm, key, sharedProperty); // computed 就是一个 defineProperty
    }

    function patch(oldVnode, vnode) {
      debugger;
      if (!oldVnode) {
        return createElm(vnode); // 如果没有el元素，那就直接根据虚拟节点返回真实节点
      }

      // 第一次挂载时， oldVnode 为 $el
      if (oldVnode.nodeType == 1) {
        // 用vnode  来生成真实dom 替换原本的dom元素
        const parentElm = oldVnode.parentNode; // 找到他的父亲
        let elm = createElm(vnode); //根据虚拟节点 创建元素

        // 在第一次渲染后 是删除掉节点，下次在使用无法获取
        parentElm.insertBefore(elm, oldVnode.nextSibling);
        parentElm.removeChild(oldVnode);
        return elm;
      } else {
        // 如果标签名称不一样 直接删掉老的换成新的即可
        if (oldVnode.tag !== vnode.tag) {
          // 可以通过 vnode.el 属性。获取现在真实的dom 元素
          return oldVnode.el.parentNode.replaceChild(createElm(vnode), oldVnode.el);
        }

        // 如果标签一样比较属性， 传入新的虚拟节点，和老的属性。用新的属性更新老的
        let el = vnode.el = oldVnode.el; // 表示的当前新节点 复用老节点

        // 如果两个虚拟节点是文本节点 比较文本内容...

        if (vnode.tag === undefined) {
          //  新老都是文本
          if (oldVnode.text !== vnode.text) {
            el.textContent = vnode.text;
          }
          return;
        }

        // 属性可能有删除的情况
        patchProps(vnode, oldVnode.data);

        // 一方有儿子， 一方没儿子
        let oldChildren = oldVnode.children || [];
        let newChildren = vnode.children || [];
        if (oldChildren.length > 0 && newChildren.length > 0) {
          // 双方都有儿子
          // vue 用双指针的方式来比对
          patchChildren(el, oldChildren, newChildren);
        } else if (newChildren.length > 0) {
          // 老的没儿子 但是新的有儿子
          for (let i = 0; i < newChildren.length; i++) {
            let child = createElm(newChildren[i]);
            el.appendChild(child); // 循环创建新节点
          }
        } else if (oldChildren.length > 0) {
          // 老的有儿子 新的没儿子
          el.innerHTML = ``; // 直接删除老节点
        }
        // vue 的特点是每一个组件都有一个 watcher, 当前组件中数据变化 只需要更新当前组件
      }
    }

    function isSameVnode(oldVnode, newVnode) {
      return oldVnode.tag == newVnode.tag && oldVnode.key == newVnode.key;
    }
    function patchChildren(el, oldChildren, newChildren) {
      let oldStartIndex = 0;
      let oldStartVnode = oldChildren[0];
      let oldEndIndex = oldChildren.length - 1;
      let oldEndVnode = oldChildren[oldEndIndex];
      let newStartIndex = 0;
      let newStartVnode = newChildren[0];
      let newEndIndex = newChildren.length - 1;
      let newEndVnode = newChildren[newEndIndex];

      // 同时循环新的节点和老的节点，有一方循环完毕就结束
      while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        if (isSameVnode(oldStartVnode, newStartVnode)) {
          // 头头比较， 发现标签一致
          patch(oldStartVnode, newStartVnode);
          oldStartVnode = oldChildren[++oldStartIndex];
          newStartVnode = newChildren[++newStartIndex];
        } else if (isSameVnode(oldEndVnode, newEndVnode)) {
          // 从尾部开始比较
          patch(oldEndVnode, newEndVnode);
          oldEndVnode = oldChildren[--oldEndIndex];
          newEndVnode = newChildren[--newEndIndex];
        } else if (isSameVnode(oldStartVnode, newEndVnode)) {
          // 头尾比较
          patch(oldStartVnode, newEndVnode);
          // 移动老的元素， 老的元素被移动走了，不用删除
          el.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling);
          oldStartVnode = oldChildren[++oldStartIndex];
          newEndVnode = newChildren[--newEndIndex];
        } else if (isSameVnode(oldEndVnode, newStartVnode)) {
          // 尾头比较
          patch(oldEndVnode, newStartVnode);
          el.insertBefore(oldEndVnode.el, oldStartVnode.el);
          oldEndVnode = oldChildren[--oldEndIndex];
          newStartVnode = newChildren[++newStartIndex];
        }
      }

      // 这里是没有比对完的
      if (newStartIndex <= newEndIndex) {
        for (let i = newStartIndex; i <= newEndIndex; i++) {
          // 看一下为指针的下一个元素是否存在
          let anchor = newChildren[newEndIndex + 1] == null ? null : newChildren[newEndIndex + 1].el;
          el.insertBefore(createElm(newChildren[i]), anchor);
        }
      }
      if (oldStartIndex <= oldEndIndex) {
        for (let i = oldStartIndex; i <= oldEndIndex; i++) {
          el.removeChild(oldChildren[i].el);
        }
      }
    }
    function patchProps(vnode, oldProps = {}) {
      // 此次渲染时可以调用此方法， 后续更新也可以调用此方法
      let newProps = vnode.data || {};
      let el = vnode.el;
      // 如果老的属性有， 新的没有直接删除
      let newStyle = newProps.style || {};
      let oldStyle = oldProps.style || {};
      for (let key in oldStyle) {
        if (!newStyle[key]) {
          // 新的里面不存在这个样式
          el.style[key] = '';
        }
      }
      for (let key in oldProps) {
        if (!newProps[key]) {
          el.removeAttribute(key);
        }
      }
      // 直接用新的生成到元素上
      for (let key in newProps) {
        if (key === 'style') {
          for (let styleName in newProps.style) {
            el.style[styleName] = newProps.style[styleName];
          }
        } else {
          el.setAttribute(key, newProps[key]);
        }
      }
    }

    // 创建真实节点的
    function createComponent$1(vnode) {
      let i = vnode.data; //  vnode.data.hook.init
      if ((i = i.hook) && (i = i.init)) {
        i(vnode); // 调用init方法
      }

      if (vnode.componentInstance) {
        // 有属性说明子组件new完毕了，并且组件对应的真实DOM挂载到了componentInstance.$el
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
        // 元素
        if (createComponent$1(vnode)) {
          // 返回组件对应的真实节点
          return vnode.componentInstance.$el;
        }
        vnode.el = document.createElement(tag); // 虚拟节点会有一个el属性 对应真实节点
        children.forEach(child => {
          vnode.el.appendChild(createElm(child));
        });
      } else {
        vnode.el = document.createTextNode(text);
      }
      return vnode.el;
    }

    function mountComponent(vm) {
      let updateComponent = () => {
        vm._update(vm._render());
      };
      // 观察者模式： 属性是“被观察者” 刷新页面: “观察者”
      callHook(vm, 'beforeMount');
      // 每个组件都有一个 watcher, 我们把这个 watcher 称之为渲染 watcher
      new Watcher(vm, updateComponent, () => {
        console.log('后续增加更新钩子函数 update');
      }, true);
      callHook(vm, 'mounted');
      // updateComponent()
    }

    function lifeCycleMixin(Vue) {
      Vue.prototype._update = function (vnode) {
        // 既有初始化，又有更新
        // 采用的是 先深度遍历 创建节点（遇到节点就创造节点，递归创建）
        const vm = this;
        vm.$el = patch(vm.$el, vnode);
      };
      Vue.prototype.$nextTick = nextTick;
    }
    function callHook(vm, hook) {
      let handlers = vm.$options[hook];
      if (handlers) {
        for (let i = 0; i < handlers.length; i++) {
          handlers[i].call(vm);
        }
      }
    }

    function initMixin(Vue) {
      // 后续组件化开发的时候  Vue.extend 可以创造一个子组件，子组件可以继承Vue，子组件也可以调用_init方法
      Vue.prototype._init = function (options) {
        const vm = this;
        // 把用户的选项放到 vm上，这样在其他方法中都可以获取到options 了
        vm.$options = mergeOptions(vm.constructor.options, options); // 为了后续扩展的方法 都可以获取$options选项

        callHook(vm, 'beforeCreate');
        // options中是用户传入的数据 el , data
        initState(vm);
        callHook(vm, 'created');
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
      };
      // new Vue({el}) new Vue().$mount
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
        }

        // console.log(opts.render)
        mountComponent(vm); // 组件的挂载流程
      };
    }

    function createElement(vm, tag, data = {}, ...children) {
      // 如果tag是组件 应该渲染一个组件的vnode

      if (isReservedTag(tag)) {
        return vnode(vm, tag, data, data.key, children, undefined);
      } else {
        const Ctor = vm.$options.components[tag];
        return createComponent(vm, tag, data, data.key, children, Ctor);
      }
    }
    // 创建组件的虚拟节点, 为了区分组件和元素  data.hook  /  componentOptions
    function createComponent(vm, tag, data, key, children, Ctor) {
      // 组件的构造函数
      if (isObject(Ctor)) {
        Ctor = vm.$options._base.extend(Ctor); // Vue.extend
      }

      data.hook = {
        // 等会渲染组件时 需要调用此初始化方法
        init(vnode) {
          let vm = vnode.componentInstance = new Ctor({
            _isComponent: true
          }); // new Sub 会用此选项和组件的配置进行合并
          vm.$mount(); // 组件挂载完成后 会在 vnode.componentInstance.$el => <button>
        }
      };

      return vnode(vm, `vue-component-${tag}`, data, key, undefined, undefined, {
        Ctor,
        children
      });
    }
    function createTextElement(vm, text) {
      return vnode(vm, undefined, undefined, undefined, undefined, text);
    }
    function vnode(vm, tag, data, key, children, text, componentOptions) {
      return {
        vm,
        tag,
        data,
        key,
        children,
        text,
        componentOptions
        // .....
      };
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
        return createTextElement(vm, text); // 描述虚拟节点是属于哪个实例的
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
        } = vm.$options; // 就是我们解析出来的 render 方法，同事也有可能是用户写的
        let vnode = render.call(vm);
        return vnode;
      };
    }

    function initGlobalApi(Vue) {
      Vue.options = {}; // 用来存放全局的配置 , 每个组件初始化的时候都会和options选项进行合并
      /*   Vue.component
      Vue.filter
      Vue.directive */

      Vue.mixin = function (options) {
        this.options = mergeOptions(this.options, options);
        return this;
      };
      Vue.options._base = Vue; // 无论后续创建多少个子类 都可以通过_base 找到 Vue
      Vue.options.components = {};
      Vue.component = function (id, definition) {
        // 保证组件的隔离， 每个组件都会产生一个新的类，去继承父类
        definition = this.options._base.extend(definition);
        this.options.components[id] = definition;
      };

      // 给个对象返回类
      Vue.extend = function (opts) {
        // extend方法就是产生一个继承于Vue的类
        // 并且身上应该有父类的所有功能
        const Super = this;
        const Sub = function VueComponent(options) {
          this._init(options);
        };
        // 原型继承
        Sub.prototype = Object.create(Super.prototype);
        Sub.prototype.constructor = Sub;
        Sub.options = mergeOptions(Super.options, opts); // 只和Vue.options合并
        return Sub;
      };
    }

    // vue 要如何实现，原型模式，所有的功能都通过原型扩展的方式来添加
    function Vue(options) {
      this._init(options); // 实现vue的初始化功能
    }

    initMixin(Vue);
    renderMixin(Vue);
    lifeCycleMixin(Vue);
    stateMixin(Vue);
    initGlobalApi(Vue);

    // diff 核心
    let oldTemplate = `<div>
    <li key="A">A</li>
    <li key="B">B</li>
    <li key="C">C</li>
    <li key="D">D</li>
</div>`; // 在最外层创建了一个根节点 vue3可以

    let vm1 = new Vue({
      data: {
        message: 'hello world'
      }
    });
    const render1 = compileToFunction(oldTemplate);
    const oldVnode = render1.call(vm1); // 虚拟dom
    document.body.appendChild(createElm(oldVnode));

    // v-if   v-else
    let newTemplate = `<div >
<li key="D">D</li>
<li key="A">A</li>
<li key="B">B</li>
<li key="C">C</li>
</div>`;
    let vm2 = new Vue({
      data: {
        message: 'zf'
      }
    });
    const render2 = compileToFunction(newTemplate);
    const newVnode = render2.call(vm2); // 虚拟dom
    // 根据新的虚拟节点更新老的节点，老的能复用尽量复用

    setTimeout(() => {
      patch(oldVnode, newVnode);
      console.log('setTimeout~~~~~');
    }, 2000);

    // 1.new Vue 会调用_init方法进行初始化操作
    // 2.会将用户的选项放到 vm.$options上
    // 3.会对当前属性上搜素有没有data 数据   initState
    // 4.有data 判断data是不是一个函数 ，如果是函数取返回值 initData
    // 5.observe 去观测data中的数据 和 vm没关系，说明data已经变成了响应式
    // 6.vm上像取值也能取到data中的数据 vm._data = data 这样用户能取到data了  vm._data
    // 7.用户觉得有点麻烦 vm.xxx => vm._data
    // 8.如果更新对象不存在的属性，会导致视图不更新， 如果是数组更新索引和长度不会触发更新
    // 9.如果是替换成一个新对象，新对象会被进行劫持，如果是数组存放新内容 push unshift() 新增的内容也会被劫持
    // 通过__ob__ 进行标识这个对象被监控过  （在vue中被监控的对象身上都有一个__ob__ 这个属性）
    // 10如果你就想改索引 可以使用$set方法 内部就是splice()

    // 如果有el 需要挂载到页面上

    return Vue;

}));
//# sourceMappingURL=vue.js.map
