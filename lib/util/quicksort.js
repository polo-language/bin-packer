module.exports = {
  quicksort: quicksort,
  quicksortArray: quicksortArray,
  _getMedianOfThree: getMedianOfThree,
}

const utils = require('./utils')

/**
 * Sorts {@param obj} on the value of the numeric property given by {@param measure}.
 * If {@param obj} is a non-array object, its values are first extracted to an array, discarding the keys.
 * @param {array|object} obj    The object to sort
 * @param {string} measure      The numeric property of each array element to sort by.
 * @param {boolean} lowToHigh   Whether to sort lowest to highest, defaults to true.
 * @returns An object with a 'sorted' property containing a sorted array
 *          and a 'invalid' property with an object containing all key-value pairs where the value
 *          either wasn't an object or didn't contain a numerical {@param measure} propertytypeof yourVariable === 'object'.
 */
function quicksort(obj, measure, lowToHigh = true) {
  const {valid: valid, invalid: invalid} = utils.validate(utils.toIterable(obj), utils.measureValidator.bind(null, measure))
  quicksortArray(valid, measure, 0, valid.length - 1, lowToHigh)
  return {'sorted': valid, 'invalid': invalid}
}

/**
 * Quicksorts a subset of an array. Assumes each array value is valid, i.e. is an object with a 
 * numerical {@param measure} property.
 * @param {array} array 
 * @param {string} measure      The numeric property of each array element to sort by.
 * @param {number} left         The index of the leftmost element of the subarray to sort.
 * @param {number} right        The index of the rightmost element of the subarray to sort (inclusive).
 * @param {boolean} lowToHigh   Whether to sort lowest to highest.
 */
function quicksortArray(array, measure, left, right, lowToHigh) {
  if (left < right) {
    const pivot = partition(array, measure, left, right, lowToHigh)
    quicksortArray(array, measure, left, pivot - 1, lowToHigh)
    quicksortArray(array, measure, pivot + 1, right, lowToHigh)
  }
}

function partition(array, measure, left, right, lowToHigh) {
  const pivot = getMedianOfThree(array, measure, left, right)
      , pivotValue = array[pivot][measure]
  let tempIndex = left

  swap(array, pivot, right)
  for (let i = left; i < right; ++i) {
    if (lowToHigh) {
      if (array[i][measure] < pivotValue) {
        swap(array, i, tempIndex)
        ;++tempIndex
      }
    } else {
      if (array[i][measure] > pivotValue) {
        swap(array, i, tempIndex)
        ;++tempIndex
      }
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
      , lowSize = array[left][measure]
      , midSize = array[mid][measure]
      , highSize = array[right][measure]

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
