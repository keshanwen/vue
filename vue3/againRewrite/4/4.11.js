const data = {
  foo: 1,
  bar: 2,
};

let activeEffect,
  effectStack = [],
  jobQueue = new Set();

const bucket = new WeakMap();
const p = Promise.resolve();

let isFlushing = false;

function flushJob() {
  if (isFlushing) return;
  isFlushing = true;
  p.then(() => {
    jobQueue.forEach((effectFn) => effectFn());
  }).finally(() => {
    isFlushing = false;
  });
}

function effect(fn, options = {}) {
  const effectFn = () => {
    cleanup(effectFn);
    activeEffect = effectFn;
    effectStack.push(activeEffect);
    const res = fn();
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
    return res;
  };
  effectFn.deps = [];
  effectFn.options = options;
  if (options.lazy) {
    return effectFn;
  } else {
    effectFn();
  }
}

function cleanup(effectFn) {
  for (let i = 0, len = effectFn.length; i < len; i++) {
    let deps = effectFn.deps[i];
    deps.delete(effectFn);
  }
  effectFn.deps.length = 0;
}

const obj = new Proxy(data, {
  get(target, p, receiver) {
    track(target, p);
    return Reflect.get(...arguments);
  },
  set(target, p, value, receiver) {
    Reflect.set(...arguments);
    trigger(target, p);
    return true;
  },
});

function track(target, key) {
  if (!activeEffect) return;
  let depsMap = bucket.get(target);
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()));
  }
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  deps.add(activeEffect);
  activeEffect.deps.push(deps);
}

function trigger(target, key) {
  const depsMap = bucket.get(target);
  if (!depsMap) return;
  const effects = depsMap.get(key);
  const effectToRun = new Set();
  effects &&
    effects.forEach((effectFn) => {
      if (effectFn !== activeEffect) {
        effectToRun.add(effectFn);
      }
    });
  effectToRun &&
    effectToRun.forEach((fn) => {
      if (fn.options.scheduler) {
        fn.options.scheduler(fn);
      } else {
        fn();
      }
    });
}

function watch(source, cb, options = {}) {
  let getter;
  if (typeof source === "function") {
    getter = source;
  } else {
    getter = () => traverse(source);
  }
  let oldValue, newValue;
  let cleanup; // cleanup 用来保存上一次回调的过期处理函数
  function onInvalidate(fn) {
    cleanup = fn;
  }

  function job() {
    newValue = effectFn();
    if (cleanup) cleanup(); // 如果上一次回调注册了处理过期函数，则先执行过期处理函数
    cb(oldValue, newValue, onInvalidate);
    oldValue = newValue;
  }

  const effectFn = effect(
    () => {
      return getter();
    },
    {
      lazy: true,
      scheduler(fn) {
        if (options.flush === "post") {
          jobQueue.add(job);
          flushJob();
        } else {
          job();
        }
      },
    }
  );

  if (options.immediate) {
    job();
  } else {
    oldValue = effectFn();
  }
}

function traverse(value, seen = new Set()) {
  // source是原始值, null, 或者已经读取过，就直接返回
  if (typeof value !== "object" || value === null || seen.has(value)) return;
  seen.add(value);
  // 不考虑数组等结构，只考虑source是一个对象
  // for in 读取对象的每一个值
  for (const k in value) {
    traverse(value[k], seen);
  }
  return value;
}

watch(
  () => obj.foo,
  async (oldValue, newValue, onInvalidate) => {
    let expired = false;
    onInvalidate(() => (expired = true));

    // await testApi()

    if (!expired) {
      // 赋值操作
    }
  },
  {
    flush: "post",
  }
);
