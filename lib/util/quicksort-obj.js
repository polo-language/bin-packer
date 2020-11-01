module.exports = {
  quicksortObj: quicksortObj,
  quicksortObjSingletons: quicksortObjSingletons,
  _getArrayOfObjSingletons: getArrayOfObjSingletons,
  _getMedianOfThree: getMedianOfThree,
  _getSingleKey: getSingleKey,
}

function quicksortObj(obj, measure) {
  const array = getArrayOfObjSingletons(obj)
  quicksortObjSingletons(array, measure, 0, array.length - 1)
  return array
}

function quicksortObjSingletons(array, measure, left, right) {
  if (left < right) {
    const pivot = partition(array, measure, left, right)
    quicksortObjSingletons(array, measure, left, pivot - 1)
    quicksortObjSingletons(array, measure, pivot + 1, right)
  }
}

function partition(array, measure, left, right) {
  const pivot = getMedianOfThree(array, measure, left, right)
    , pivotValue = getSize(array[pivot], measure)
  let tempIndex = left

  swap(array, pivot, right)
  for (let i = left; i < right; ++i) {
    if (getSize(array[i], measure) < pivotValue) {
      swap(array, i, tempIndex)
      ;++tempIndex
    }
  }
  swap(array, tempIndex, right)
  return tempIndex
}

/**
 * Returns the index of the median of the values at left, right, and halfway between.
 */
function getMedianOfThree(array, measure, left, right) {
  const mid = left + Math.floor((right + 1 - left)/2)
    , lowSize = getSize(array[left], measure)
    , midSize = getSize(array[mid], measure)
    , highSize = getSize(array[right], measure)

  if (lowSize < midSize) {
    if (lowSize < highSize) {
      if (midSize < highSize) {
        return mid
      } else {
        return right
      }
    } else {
      return left
    }
  } else {
    if (highSize < lowSize) {
      if (midSize < highSize) {
        return right
      } else {
        return mid
      }
    } else {
      return left
    }
  }
}

function swap(array, i, j) {
  const temp = array[i]
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
  const array = []
  Object.entries(obj).forEach(([k, v]) => {
    const singleton = {}
    singleton[k] = v
    array.push(singleton)
  });
  return array
}
