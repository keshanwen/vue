import { compileToFunction } from "./compiler";
import { mountComponent } from "./lifeCycle";
import { initState } from "./state";
import { mergeOptions, nextTick } from "./utils";
export function initMixin(Vue) {
    Vue.prototype._init = function(options) {
        const vm = this;
        vm.$options = mergeOptions(vm.constructor.options,options); 
        initState(vm);
        if (vm.$options.el) {
            vm.$mount(vm.$options.el);
        }
    }
    Vue.prototype.$mount = function(el) {
        const vm = this;
        const opts = vm.$options;
        el = document.querySelector(el); 
        vm.$el = el; 
        if (!opts.render) {
            let template = opts.template;
            if (!template) {
                template = el.outerHTML;
            }
            let render = compileToFunction(template)
            opts.render = render;
        }
        mountComponent(vm)
    }

    Vue.prototype.$nextTick = nextTick
}