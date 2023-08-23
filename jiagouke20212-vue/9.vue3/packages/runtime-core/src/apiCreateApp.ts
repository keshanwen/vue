import { createVnode } from "./vnode";

export function createAppAPI(render){
    return (rootComponent,rootProps)=>{ // 创建应用你需要给我传入组件和属性
        let app = {
            _component:rootComponent,
            _rootProps:rootProps,
            _container:null,
            use(){

            },
            mixin(){

            },
            component(){

            },
            mount(container){ // 容器
                // 创建一个虚拟节点
                const vnode = createVnode(rootComponent,rootProps); // h方法
    
                // 将虚拟节点 转换成真实节点，插入到container中
    
                render(vnode,container);

                app._container = container;
                
            }
        }
        return app
    }
}