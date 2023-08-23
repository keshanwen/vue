import { effect } from "@vue/reactivity";
import { ShapeFlags } from "@vue/shared";
import { createAppAPI } from "./apiCreateApp"
import { createComponentInstance, setupComponent } from "./component";
export function createRenderer(rendererOptions) { // 不同的平台 rendererOptions 渲染属性是不同的

    const {
        insert: hostInsert,
        remove: hostRemove,
        patchProp: hostPatchProp,
        createElement: hostCreateElement,
        createText: hostCreateText,
        setText: hostSetText,
        setElementText: hostSetElementText,
    } = rendererOptions

    const mountChildren = (children, container) => {
        for (let i = 0; i < children.length; i++) {
            patch(null, children[i], container)
        }
    }
    const mountElement = (n2, container) => {
        // 递归渲染虚拟节点
        const { props, type, children, shapeFlag } = n2;
        let el = n2.el = hostCreateElement(type)
        if (props) {
            for (let key in props) {
                hostPatchProp(el, key, null, props[key]);
            }
        }
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            hostSetElementText(el, children);
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(children, el);
        }
        hostInsert(el, container);
    }


    const processElement = (n1, n2, container) => {
        if (n1 == null) {
            // 元素的初始化
            mountElement(n2, container);
        } else {
            // 元素的diff
        }
    }


    const patch = (n1, n2, container) => { // n2 如果为null 会走销毁逻辑


        // 渲染逻辑 diff算法

        const { shapeFlag } = n2;

        if (shapeFlag & ShapeFlags.ELEMENT) {
            // n2 是什么类型的 如果是一个元素的虚拟节点 -》 创建一个元素的真实节点 插入到容器中
            processElement(n1, n2, container);

        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
            // 初始化的时候 n2 是一个组件的虚拟节点
            processComponent(n1, n2, container);

        }
    }
    // 和 vue2 组件渲染一致 -》 组件的虚拟节点-》 创造组件实例-》 调用组件的render方法 -》 拿到组件的返回的虚拟节点 -》 创建真是节点 
    // vue2 组件每个组件都有一个watcher， 如果数据更新 重新执行watcher， 依赖收集


    const setupRenderEffect = (instance, container) => {
        instance.update = effect(() => { // effect执行后会返回一个响应式的effect
            if (!instance.isMounted) {
                // 初渲染逻辑, 会进行依赖收集 用到的属性 会将组件的effect收集起来

                let subTree = instance.subTree = instance.render.call(instance.proxy, instance.proxy)

                patch(null, subTree, container);

                instance.isMounted = true;
            } else {
                // 数据变化了 会执行此逻辑 diff算法
                let prevSubTree = instance.subTree;
                let nextSubTree =  instance.render.call(instance.proxy, instance.proxy);

                // patch(prevSubTree, nextSubTree, container);

                // 下周四 周六 手写Vuex4.0
                // 下周四 周六 手写Vue-router4.0
                // 
            }
        },{
            scheduler(effect){ // 多次更新 可以批量更新  effect.uid
                // queueWatcher
                console.log(effect,'--------------');
            }
        })
    }

    const mountComponent = (n2, container) => {
        // 1.组件如何挂载？  new vnode.componentOptions.Ctor => vnode.componentInstance
        // 创建一个组件的实例
        const instance = createComponentInstance(n2); // 组件创建流程

        setupComponent(instance); // 将自己的数据 填充到instance上

        // instance.render(instance.proxy ) => h()  => 虚拟节点 => 真实节点
        setupRenderEffect(instance, container); // 添加渲染effect
    }
    const processComponent = (n1, n2, container) => {
        if (n1 == null) {
            // 初始化
            mountComponent(n2, container);
        } else {
            // 组件更新 updateComponent  组件的diff
        }
    }


    const render = (vnode, container) => { // 初次渲染流程
        // 根据虚拟节点 创建真实节点 插入到容器中
        patch(null, vnode, container)
    }

    return { // 把这个api单独的抽离成了一个文件，并把render函数传入
        createApp: createAppAPI(render)
    }
}