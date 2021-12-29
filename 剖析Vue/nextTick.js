let callbacks = [] // 存放nextTick的回调
let pending = false
let uid = 0
let has = {}
let queue = []
let wating = false


function nextTick(cb) {
  callbacks.push(cb)

  if (!pending) {
    pending = true
    setTimeout(fulshCallbacks,0)
  }
}

function fulshCallbacks() {
  pending = false
  const copies = callbacks.slice(0)
  callbacks.length = 0
  for (let i = 0; i < copies.length;i++) {
    copies[i]()
  }
}

class Watcher {
  constructor() {
    this.id = ++uid
  }

  update() {
    console.log('watch   ' + this.id + '   update')
    queueWatcher(this)
  }

  run() {
    console.log('watch   ' + this.id + '   视图更新啦~')
  }
}

function queueWatcher(watcher) {
  let id = watcher.id
  if (has[id] == null) {
    has[id] = true
    queue.push(watcher)

    if (!wating) {
      wating = true
      nextTick(flushSchedulerQueue)
    }
  }
}

function flushSchedulerQueue() {
  let watcher,id;

  for (index = 0; index < queue.length;index++) {
    watcher = queue[index]
    id = watcher.id
    has[id] = null
    watcher.run()
  }

  wating = false
}



let watch1 = new Watcher();
let watch2 = new Watcher();

watch1.update();
watch1.update();
watch2.update();