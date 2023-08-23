
// 7,8 null / undefined 区别是什么？

// ts中 null 和 undefiend 可以赋值给任何类型(任何类型的子类型)  严格模式中不能将null 和 undefined 赋值给其他类型
// 严格模式中 null -> null  undefined -> undefined
let un:undefined = undefined;
let nu:null = null;



// 9.void 空类型 一般用于函数的返回值类型
// strictNullChecks 如果开启null的严格检测 则null不能赋值给其他人

// void能接受的返回值有 undefined 和 null，在严格模式下不能使用null
function a():void{
    
}


// 10.never 标识永远不 1） 程序无法到终点（死循环，抛错） 2） 判断的时候会出现never 3） 用never来做一些特殊的处理


function throwError():never{
    throw new Error()
}

function whileTrue():never{
    while (true) {
        
    }
}
function getVal(str:string){ // 在判断永远无法走到的时候 结果是never类型
    if(typeof str == 'string'){
        str
    }else{
        str
    }

}
// Symbol bigInt

let s1:symbol = Symbol()
let s2 = Symbol() // symbol 是独一无二的 


let big1 = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1)
let big2 = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(2)
console.log(big1 === big2)


// string number boolean 元组 数组 枚举  void null undefined （symbol  bigInt） never  any(放弃ts检测)



function create(o:object){ // 除了基本类型其他以外的类型可以使用 object
    o
}

create({})
create([]);
create(function(){})

export { }