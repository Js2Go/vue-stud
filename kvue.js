// new KVue({data: {...}})
class KVue {
  constructor(options) {
    this.$options = options

    // 数据响应化
    this.$data = options.data
    this.observe(this.$data)

    // 模拟 watcher 创建
    // new Watcher()
    // this.$data.test
    new Compile(options.el, this)

    // created执行
    options.created && options.created.call(this)
  }

  observe(value) {
    if (!value || typeof value !== 'object') {
      return
    }

    // 遍历对象
    Object.keys(value).forEach(key => {
      this.defineReactive(value, key, value[key])

      // 代理data中的属性到vue实例上
      this.proxyData(key)
    })
  }

  // 数据响应化
  defineReactive(obj, key, val) {

    this.observe(val) // 解决数据层级嵌套

    const dep = new Dep()

    Object.defineProperty(obj, key, {
      get() {
        Dep.target && dep.addDep(Dep.target)
        return val
      },
      set(newVal) {
        if (newVal === val) {
          return
        } else {
          val = newVal
          // console.log(`${key}属性更新了: ${val}`)
          dep.notify()
        }
      }
    })
  }

  proxyData(key) {
    Object.defineProperty(this, key, {
      get() {
        return this.$data[key]
      },
      set(newVal) {
        this.$data[key] = newVal
      }
    })
  }
}

// Dep: 用来管理 Watcher
class Dep {
  constructor() {
    // 这里存放若干依赖
    this.deps = []
  }

  addDep(dep) {
    this.deps.push(dep)
  }

  notify() {
    this.deps.forEach(dep => dep.update())
  }
}

// Watcher
class Watcher {
  constructor(vm, key, cb) {
    this.vm = vm
    this.key = key
    this.cb = cb
    // 将当前 watch 实例指定到 Dep 静态属性 target
    Dep.target = this

    this.vm[this.key] // 触发getter，收集依赖
    Dep.target = null
  }

  update() {
    console.log('属性更新了')
    this.cb.call(this.vm, this.vm[this.key])
  }
}
