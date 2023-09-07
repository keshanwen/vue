import { nextTick } from "../utils"

let queue = [] // 存放要更新的 watcher
let has = {}

function flushSchedulerQueue() {
  // beforeUpadte
  queue.forEach(watcher => watcher.run())
  queue = []
  has = {}
  pending = false
}

let pending = false
export function queueWatcher(watcher) {
  let id = watcher.id
  if (has[id] == null) {
    has[id] = true
    queue.push(watcher)
    if (!pending) {
      nextTick(flushSchedulerQueue)
      pending = true
    }
  }
}