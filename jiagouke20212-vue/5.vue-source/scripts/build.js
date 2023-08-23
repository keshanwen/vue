const fs = require('fs') // node中的读取文件的模块
const path = require('path') // 处理路径的
const zlib = require('zlib') // 做压缩的
const rollup = require('rollup') // rollup 打包工具
const terser = require('terser') // 代码uglyfy

if (!fs.existsSync('dist')) { // 创建一个dist目录 用于存放打包后的结果的
  fs.mkdirSync('dist')
}

// 获取打包后的配置信息
let builds = require('./config').getAllBuilds() // [rollConfig,rollupConfig]

// filter builds via command line arg  可以通过命令参数 获取打包的内容
if (process.argv[2]) {
  const filters = process.argv[2].split(',')
  builds = builds.filter(b => { // 过滤需要打包那些
    return filters.some(f => b.output.file.indexOf(f) > -1 || b._name.indexOf(f) > -1)
  })
} else {
  // filter out weex builds by default  默认打包过滤掉weex
  builds = builds.filter(b => {
    return b.output.file.indexOf('weex') === -1
  })
}

// 调用rollup 根据不同的入口 、参数、类型 进行生成打包的结果
build(builds)
 
// 递归一个个将入口进行打包操作
function build (builds) {
  let built = 0
  const total = builds.length
  const next = () => {
    buildEntry(builds[built]).then(() => {
      built++
      if (built < total) {
        next()
      }
    }).catch(logError)
  }

  next()
}

function buildEntry (config) {
  const output = config.output
  const { file, banner } = output
  const isProd = /(min|prod)\.js$/.test(file)
  return rollup.rollup(config)
    .then(bundle => bundle.generate(output))
    .then(({ output: [{ code }] }) => {
      if (isProd) {
        const minified = (banner ? banner + '\n' : '') + terser.minify(code, {
          toplevel: true,
          output: {
            ascii_only: true
          },
          compress: {
            pure_funcs: ['makeMap']
          }
        }).code
        return write(file, minified, true)
      } else {
        return write(file, code)
      }
    })
}

// 仅仅是将打包后的结果 放入到dist目录中
function write (dest, code, zip) {
  return new Promise((resolve, reject) => {
    function report (extra) {
      console.log(blue(path.relative(process.cwd(), dest)) + ' ' + getSize(code) + (extra || ''))
      resolve()
    }

    fs.writeFile(dest, code, err => {
      if (err) return reject(err)
      if (zip) {
        zlib.gzip(code, (err, zipped) => {
          if (err) return reject(err)
          report(' (gzipped: ' + getSize(zipped) + ')')
        })
      } else {
        report()
      }
    })
  })
}

function getSize (code) {
  return (code.length / 1024).toFixed(2) + 'kb'
}

function logError (e) {
  console.log(e)
}

function blue (str) {
  return '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m'
}
