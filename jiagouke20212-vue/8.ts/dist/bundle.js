(function (exports) {
	'use strict';

	// 默认引入第三方模块需要给一个解析方式
	// import $ from 'jquery'
	// import png from './a.png'
	// import component from 'a.vue'
	// component.install
	// import export es6语法  / export =  和 import 语法 node中使用 
	// 默认全部使用import 和 export即可
	// import r = require('./a')
	let a = 'hello';

	exports.a = a;

	Object.defineProperty(exports, '__esModule', { value: true });

	return exports;

}({}));
//# sourceMappingURL=bundle.js.map
