// new Compile(el, vm)
class Compile {
  constructor(el, vm) {
    // 要遍历的宿主节点
    this.$el = document.querySelector(el)
    this.$vm = vm

    // 开始编译
    if (this.$el) {
      // 转换内部内容为Fragment
      this.$fragment = this.node2Fragment(this.$el)
      // 执行编译
      this.compile(this.$fragment)
      // 将编译完的html结果追加至$el
      this.$el.appendChild(this.$fragment)
    }
  }
  // 将宿主元素代码片段拿出来遍历，这样比较高效
  node2Fragment(el) {
    const frag = document.createDocumentFragment()
    // 将el中所有子元素搬家至frag中
    let child
    while (child = el.firstChild) {
      frag.appendChild(child)
    }
    return frag
  }

  compile(el) {
    const childNodes = el.childNodes
    Array.from(childNodes).forEach(node => {
      if (this.isElement(node)) {
        // 元素
        // console.log(`元素类型${node.nodeName}`)
        const nodeAttrs = node.attributes
        Array.from(nodeAttrs).forEach(attr => {
          const attrName = attr.name // 属性名
          const exp = attr.value // 属性值
          if (this.isDirective(attrName)) {
            // k-text
            const dir = attrName.substring(2)
            // 执行指令
            this[dir] && this[dir](node, this.$vm, exp)
          }
          if (this.isEvent(attrName)) {
            const dir = attrName.substring(1)
            this.eventHandler(node, this.$vm, exp, dir)
          }
        })
      } else if (this.isInterpolation(node)) {
        // 文本
        // console.log(`编译文本${node.textContent}`)
        this.compileText(node)
      }

      // 递归子节点
      if (node.childNodes && node.childNodes.length) {
        this.compile(node)
      }
    })
  }

  // 更新函数
  update(node, vm, exp, dir) {
    const updaterFn = this[`${dir}Updater`]
    // 初始化
    updaterFn && updaterFn(node, vm[exp])
    // 依赖收集
    new Watcher(vm, exp, value => {
      updaterFn && updaterFn(node, value)
    })
  }

  text(node, vm, exp) {
    this.update(node, vm, exp, 'text')
  }

  // 双向绑定
  model(node, vm, exp) {
    this.update(node, vm, exp, 'model')

    node.addEventListener('input', e => {
      vm[exp] = e.target.value
    })
  }

  html(node, vm, exp) {
    this.update(node, vm, exp, 'html')
  }

  eventHandler(node, vm, exp, dir) {
    const fn = vm.$options.methods && vm.$options.methods[exp]
    if (dir && fn) {
      node.addEventListener(dir, fn.bind(vm))
    }
  }

  htmlUpdater(node, value) {
    node.innerHTML = value
  }

  modelUpdater(node, value) {
    node.value = value
  }

  textUpdater(node, value) {
    node.textContent = value
  }

  isDirective(attr) {
    return attr.indexOf('k-') == 0
  }

  isEvent(attr) {
    return attr.indexOf('@') == 0
  }

  isElement(node) {
    return node.nodeType === 1
  }

  isInterpolation(node) {
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
  }

  compileText(node) {
    // console.log(RegExp.$1)
    // node.textContent = this.$vm.$data[RegExp.$1]
    this.update(node, this.$vm, RegExp.$1, 'text')
  }
}