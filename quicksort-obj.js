module.exports = {
  quickSortObj: quickSortObj,
  quickSortObjSingletons: quickSortObjSingletons,
  getArrayOfObjSingletons: getArrayOfObjSingletons,
  getMedianOfThree: getMedianOfThree,
}

function quickSortObj(obj, measure) {
  var array = getArrayOfObjSingletons(obj)
  quickSortObjSingletons(array, measure, 0, array.length - 1)
  return array
}

function quickSortObjSingletons(array, measure, low, high) {
  if (low < high) {
    var pivot = partition(array, measure, low, high)
    quickSortObjSingletons(array, measure, low, pivot - 1)
    quickSortObjSingletons(array, measure, pivot + 1, high)
  }
}

function partition(array, measure, low, high) {
  var pivot = getMedianOfThree(array, measure, low, high)
    , pivotValue = getSize(array[pivot], measure)
    , tempIndex = low

  swap(array, pivot, high)
  for (var i = low; i < high; ++i) {
    if (getSize(array[i], measure) < pivotValue) {
      swap(array, i, tempIndex)
      ;++tempIndex
    }
  }
  swap(array, tempIndex, high)
  return tempIndex
}

function getMedianOfThree(array, measure, low, high) {
  var middle = low + Math.floor((high + 1 - low)/2)
    , lowSize = getSize(array[low], measure)
    , midSize = getSize(array[middle], measure)
    , highSize = getSize(array[high], measure)
    , lower
    , higher
    , temp

  if (lowSize < midSize) {
    lower = lowSize
    higher = midSize
  } else {
    lower = midSize
    higher = lowSize

    temp = low
    low = middle
    middle = temp
  }
  if (lower < highSize) {
    if (higher < highSize)
      return middle
    else
      return high
  } else {
    return low
  }
}

function swap(array, i, j) {
  var temp = array[i]
  array[i] = array[j]
  array[j] = temp
}

function getSingleKey(obj) {
  return Object.keys(obj)[0]
}

function getSize(obj, measure) {
  return obj[getSingleKey(obj)][measure]
}

function getArrayOfObjSingletons(obj) {
  var array = []
  for (var key in obj) {
    var newObj = {}
    newObj[key] = obj[key]
    array.push(newObj)
  }
  return array
}
