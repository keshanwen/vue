export default {
    functional: true,
    // 正常组件是一个类 this._init() 如果是函数式组件就是一个普通函数
    props: {
        to: {
            type: String,
            required: true
        }
    },
    render(h, { props, slots, data, parent }) { // render 方法和 template 等价的 =》 template 语法需要被编译成 render 函数
        const click = () => {
            // 组件中的$router
            parent.$router.push(props.to)
        }

        return <a onClick={ click }>{ slots().default } </a>
    }
}