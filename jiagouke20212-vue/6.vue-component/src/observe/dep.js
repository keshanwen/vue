let id = 0;
// dep.subs = [watcher];
// watcher.deps = [dep]
class Dep {
    constructor(){ // 要把watcher放到dep中
        this.subs = [];
        this.id = id++;
    }
    depend(){

        // 要给watcher也加一个标识 防止重复
        // this.subs.push(Dep.target); // 让dep记住这个watcher, watcher还要记住dep  相互的关系

        Dep.target.addDep(this); // 在watcher中在调用dep的addSub方法

    }
    addSub(watcher){
        this.subs.push(watcher); // 让dep记住watcher
    }
    notify(){
        this.subs.forEach(watcher =>watcher.update());
    }
}

Dep.target = null; // 这里我用了一个全局的变量 window.target  静态属性
export default Dep;
