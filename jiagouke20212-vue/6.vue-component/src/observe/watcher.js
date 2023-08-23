import Dep from "./dep";
import { queueWatcher } from "./scheduler";
let id = 0;
class Watcher{
    constructor(vm,fn,cb,options){ // $watch()  要将dep放到watcher中
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
    addDep(dep){
        let did = dep.id;
        if(!this.depsId.has(did)){
            this.depsId.add(did);
            this.deps.push(dep); // 做了保存id的功能 并且让watcher记住dep
            dep.addSub(this);
        }
    }
    get(){
        Dep.target = this; // Dep.target = watcher
        this.getter(); // 页面渲染的逻辑  vm.name / vm.age  
        Dep.target = null; // 渲染完毕后 就将标识清空了， 只有在渲染的时候才会进行依赖收集
    }
    update(){ // 每次更新数据都会同步调用这个update方法，我可以将更新的逻辑缓存起来，等会同步更新数据的逻辑执行完毕后，依次调用 (去重的逻辑)
        console.log('缓存更新')
        queueWatcher(this);
        // 可以做异步更新处理
        // this.get(); // vue.nextTick  [fn3]
    }
    run(){
        console.log('真正执行更新')
        this.get(); // render() 取最新的vm上的数据
    }
}


export default Watcher