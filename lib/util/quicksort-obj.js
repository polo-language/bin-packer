module.exports = {
  quicksortObj: quicksortObj,
  quicksortObjSingletons: quicksortObjSingletons,
  _getArrayOfObjSingletons: getArrayOfObjSingletons,
  _getMedianOfThree: getMedianOfThree,
  _getSingleKey: getSingleKey,
}

/**
 * 
 * @param {object} obj 
 * @param {string} measure 
 * @returns An object with the key 'sorted' containing the sorted values
 *          and a key 'invalid' with an object containing all key-value pairs where the value
 *          either wasn't an object or didn't contain a numerical {@param measure} propertytypeof yourVariable === 'object'.
 */
function quicksortObj(obj, measure) {
  const {singletons: singletons, invalid: invalid} = getArrayOfObjSingletons(obj, measure)
  quicksortObjSingletons(singletons, measure, 0, singletons.length - 1)
  return {'sorted': singletons, 'invalid': invalid}
}

/**
 * Accetps an array of object singletons. Assumes each object values is valid, i.e.
 * is itself an object and has a numerical value under the {@param measure} key.
 * @param {array} array 
 * @param {string} measure 
 * @param {number} left 
 * @param {number} right 
 */
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

/**
 * Translates to an array of objects each containing a single key-value pair from {@param obj}.
 * @param {object} obj      The object to convert.
 * @param {string} measure  No validation is performed if measure is missing.
 * @returns An object with the key 'singletons' containing the result array
 *          and a key 'invalid' with an object containing all key-value pairs where the value
 *          either wasn't an object or didn't contain a numerical {@param measure} propertytypeof yourVariable === 'object'.
 */
function getArrayOfObjSingletons(obj, measure) {
  const result = {}
    , singletons = []
    , invalids = {}
  
  for (const [k, v] of Object.entries(obj)) {
    if (measure) {
      if (typeof v !== 'object' || typeof v[measure] !== 'number') { // What about BigInt?
        invalids[k] = v
        continue
      }
    }
    const singleton = {}
    singleton[k] = v
    singletons.push(singleton)
  }

  return {'singletons': singletons, 'invalid': invalids}
}
