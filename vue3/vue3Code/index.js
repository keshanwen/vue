const vnode = {
  type: 'button',
  props: {
    disabled: ''
  },
  children: 'Button'
}


function createRenderer(options) {

  const {
    createElement,
    insert,
    setElementText
  } = options

  function shouldSetAsProps(el, key, value) {
    if (key === 'form' && el.tagName === 'INPUT') return false
    return key in el
  }

  function mountElement(vnode, container) {
    const el = createElement(vnode.type)
    if (typeof vnode.children === 'string') {
      setElementText(el, vnode.children)
    } else if (Array.isArray(vnode.children)) {
      vnode.children.forEach(child => {
        patch(null, child, el)
      })
    }


    if (vnode.props) {
      for (const key in vnode.props) {
        const value = vnode.props[key]
        if (shouldSetAsProps(el, key, value)) {
          const type = typeof el[key]
          if (type === 'boolean' && value === '') {
            el[key] = true
          } else {
            el[key] = value
          }
        } else {
          el.setAttribute(key, vnode.props[key])
        }
      }
    }

    insert(el, container)
   }

  function patch(n1, n2, container) {
    if (!n1) {
      mountElement(n2, container)
    } else {

    }
   }

  function render(vnode, container) {
    if (vnode) {
      patch(container._vnode, vnode, container)
    } else {
      if (container._vnode) {
        container.innerHTML = ''
      }
      container._vnode = vnode
    }
   }


  return {
    render
  }
}

const renderer = createRenderer({
  createElement(tag) {
    return document.createElement(tag)
  },
  setElementText(el, text) {
    el.textContent = text
  },
  insert(el, parent, anchor = null) {
    parent.insertBefore(el, anchor)
  }
})

renderer.render(vnode, document.querySelector('#app'))


