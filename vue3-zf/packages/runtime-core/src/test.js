function getSequence(arr) {
  const len = arr.length;
  const result = [0]; // 索引  递增的序列 用二分查找性能高
  const p = arr.slice(0); // 里面内容无所谓 和 原本的数组相同 用来存放索引
  let start;
  let end;
  let middle;
  for (let i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      let resultLastIndex = result[result.length - 1]
      if (arr[resultLastIndex] < arrI) {
        p[i] = resultLastIndex
        result.push(i)
        continue
      }
      // 二分查找 找到比当前值大的那一个
      start = 0
      end = result.length - 1
      while (start < end) {
        middle = ((start + end) / 2) | 0 // 找到中间位置的前一个
        if (arr[result[middle]] < arrI) {
          start = middle + 1
        } else {
          end = middle
        } // 找到结果集中， 比当前这一项大的数
      }
      // start / end 就是找到的位置
      if (arrI < arr[result[start]]) { // 如果相同 或者 比当前的还大就不换了
        if (start > 0) {
          p[i] = result[start - 1]
        }
        result[start] = i
      }
    }
  }
  let len1 = result.length
  let last = result[len1 - 1]
  while (len1-- > 0) {
    result[len1] = last
    last = p[last]
  }

  return result

}



console.log(getSequence([2, 3, 1, 5, 6, 8, 7, 9, 4]));