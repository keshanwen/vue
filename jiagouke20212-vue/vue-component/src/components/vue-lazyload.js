let VueLazyload = {
    install(Vue, userOptions) { // 声名一个指令 ，初始化懒加载功能
        let LazyClass = lazy(Vue); // koa express  插件时一个函数，返回对应的功能，为了方便传递参数
        let instance = new LazyClass(userOptions)
        Vue.directive('lazy', {
            bind: instance.add.bind(instance),
            unbind: instance.unbind.bind(instance)
        })
    }
}
// 解决this问题 常见就是bind 或者箭头函数
function getScrollParent(el) {
    let parent = el.parentNode;
    while (parent) {
        if (/(scroll)|(auto)/.test(getComputedStyle(parent)['overflow'])) {
            return parent;
        }
        parent = parent.parentNode;
    }
    return parent;
}
function lazy(Vue) { // 注入变量  es6中类的原型方法如果单独拿出来使用，他会指向undefined
    function render(imgListener,status){
        let el = imgListener.el; // 获取图片
        switch (status) {
            case 'loading': // 根据状态添加对应的图片
                el.src = imgListener.options.loading
                break;
            case 'loaded':
                el.src = imgListener.src;
                break;
            case 'error':
                el.src = imgListener.options.error;
                break;
            default:
                break;
        }
    }
    function loadImg(src){
        return new Promise((resolve,reject)=>{
            let img = new Image();
            img.src = src;
            img.onload = resolve;
            img.onerror = reject;
        })
    }
// 我希望给每个图片都增加一个实例，放到一个队列中，页面滚动时我可以去队列里查找加载哪些图片
    class ReactiveListener{
        constructor(el,src,options){
            this.el = el;
            this.src = src;
            this.options=  options;
            this.state = {loading:false}; // 用于判断图片的加载状态 , 是否加载过
        }
        checkInView(){ //检测我在不在页面中
            let {top} = this.el.getBoundingClientRect(); // 每次滚动获取的top都不一样 
            // 判断浏览的内高 和 我们图片距离顶部的高度，如果需要加载
            return top  <  window.innerHeight * this.options.preLoad
        }
        load(){ // 如果在页面中需要加载
            // 加载图片
            render(this,'loading');
            loadImg(this.src).then(()=>{
                this.state.loading = true; // 表示图片已经加载完毕了
                render(this,'loaded');
            }).catch(()=>{
                this.state.loading = true;
                render(this,'error');
            })
        } 
    }
    return class LazyClass {
        constructor(userOptions) {
            this.options = userOptions; // 为了方便获取用户传递的参数
            this.hasScrollHandler = false;
            this.queue = [];
        }
        lazyloadHandler(){
            this.queue.forEach(imgListener=>{
                if(imgListener.state.loading) return; // 只有状态时false 才需要检测在不在页面中，在去加载
                imgListener.checkInView() && imgListener.load();
            })
        }
        add(el, dirs, vnode) {
            // 1.获取能滚动的元素, 我需要等待这个元素插入到dom中，在获取父级可滚动的元素
            Vue.nextTick(() => { // dom元素肯定插入到页面中， provide原理
                // 20次
                let imgListener = new ReactiveListener(el,dirs.value,this.options)
                this.queue.push(imgListener)

                if (!this.hasScrollHandler) { // 1次
                    let ele = getScrollParent(el); // 处理节流的流程
                    ele.addEventListener('scroll',this.lazyloadHandler.bind(this),{
                        passive:true
                    });
                    this.hasScrollHandler = true;
                }
                this.lazyloadHandler(); //  默认每加载一个图片都需要先检测一次
            })
        }
        unbind() {

        }
    }
}

// let fn = new X().add // 这是获取到原型add方法
// new X().add(); // 直接通过实例调用add方法
// fn();

// 我们需要有一个假的图片 -》 换成新的  onload事件  换成新的
// 监控找到能滚动的元素 ， 多次指令生成只监控一次，节流
// 我们要监控滚动的位置 -》  当前图片是否出现在可视区域内，如果出现加载图片


// 1.如何实现图片懒加载  获取位置
export default VueLazyload