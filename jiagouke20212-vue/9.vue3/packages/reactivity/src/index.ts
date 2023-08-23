// 如果采用相对路径来进行打包， 那么当前模块在打包得时候会将这个shared打包到自己模块里
// monorepo, 能组织两个模块之间得关系，可以相互依赖
// 如果直接引用其他模块，会出现找不到，因为其他的包块不在node_modules





export {
    reactive,
    shallowReactive,
    readonly,
    shallowReadonly
} from './reactive'

export {
    effect
} from './effect'

export {
    ref,
    toRef,
    toRefs,
} from './ref'