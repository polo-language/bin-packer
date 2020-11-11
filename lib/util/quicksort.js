'use strict'

module.exports = {
  quicksort,
  quicksortArray,
  _getMedianOfThree: getMedianOfThree,
}

const utils = require('./utils')

/**
 * Quicksorts a collection of values.
 * If {@param obj} is a non-array object, its values are first extracted to an array, discarding the keys.
 * @param {iterable|object} obj    The object to sort
 * @param {function} sizeOf     A function: object -> numeric. Accepts elements of {@param obj} and returns their size.
 * @param {boolean} lowToHigh   Whether to sort lowest to highest, defaults to true.
 * @returns A sorted array
 */
function quicksort(obj, sizeOf, lowToHigh = true) {
  const array = utils.toArray(obj)
  quicksortArray(array, sizeOf, 0, array.length - 1, lowToHigh)
  return array
}

/**
 * Quicksorts a subset of an array.
 * @param {array} array 
 * @param {string} sizeOf       A function: object -> numeric. Accepts elements of {@param array} and returns their size.
 * @param {number} left         The index of the leftmost element of the subarray to sort.
 * @param {number} right        The index of the rightmost element of the subarray to sort (inclusive).
 * @param {boolean} lowToHigh   Whether to sort lowest to highest.
 */
function quicksortArray(array, sizeOf, left, right, lowToHigh) {
  if (left < right) {
    const pivot = partition(array, sizeOf, left, right, lowToHigh)
    quicksortArray(array, sizeOf, left, pivot - 1, lowToHigh)
    quicksortArray(array, sizeOf, pivot + 1, right, lowToHigh)
  }
}

function partition(array, sizeOf, left, right, lowToHigh) {
  const pivot = getMedianOfThree(array, sizeOf, left, right)
      , pivotValue = sizeOf(array[pivot])
  let tempIndex = left

  swap(array, pivot, right)
  for (let i = left; i < right; ++i) {
    if (lowToHigh) {
      if (sizeOf(array[i]) < pivotValue) {
        swap(array, i, tempIndex)
        ;++tempIndex
      }
    } else {
      if (sizeOf(array[i]) > pivotValue) {
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
function getMedianOfThree(array, sizeOf, left, right) {
  const mid = left + Math.floor((right + 1 - left)/2)
      , lowSize = sizeOf(array[left])
      , midSize = sizeOf(array[mid])
      , highSize = sizeOf(array[right])

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
