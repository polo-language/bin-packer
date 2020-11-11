'use strict'

module.exports = {
  toIterable,
  toArray,
  binaryApply,
}

/**
 * Converts the argument to an interable if it is not one already.
 * In particular, if it is a non-iterable object, returns an array of the object's own innumerable property values.
 * @param {iterable|object} obj
 */
function toIterable(obj) {
  if (obj !== null) {
    if (typeof obj[Symbol.iterator] === 'function') {
      return obj
    } else if (typeof obj === 'object') {
      return Object.values(obj)
    }
  }
  throw new Error('Must be either iterable or a non-function object')
}

function toArray(obj) {
  if (Array.isArray(obj)) {
    return obj
  } else {
    return Array.from(toIterable(obj))
  }
}

/**
 * Performs a recursive binary search to find the index at which to apply {@param operation}. The {@param array} is
 * assumed to be sorted according to {@param leq} in relation to objects of the same type as {@param item}, a property
 * which {@param operation} is required to preserve.
 * @param {array} array         A sorted array
 * @param {*} item              The item to be 'inserted' into the array. May not be of the same type as the array
 *                              elements. E.g. each array element may be an object or array into which the item 
 *                              can be inserted.
 * @param {function} leq        A function: (item, array, arrayElement) => whether item is '<=' arrayElement.
 * @param {function} operation  A function: (item, array, i) => undefined. i is index in array where item is to be applied.
 *                              Expected to modify array in-place.
 * @returns undefined           Modifies {@param array}.
 */
function binaryApply(array, item, leq, operation) {
  return binaryApplyRecursive(array, 0, array.length - 1, item, leq, operation)
}

function binaryApplyRecursive(array, left, right, item, leq, operation) {
  if (left > right) { // When left === right in the previous round due to use of floor in mid calculation
    if (left > right + 1) {
      throw new Error(`Algorithm error: left ${left} > right ${right} + 1`)
    }
    const index = left
    operation(item, array, index)
    return index
  }
  if (left === right) {
    const index = leq(item, array, array[left]) ? left : left + 1
    operation(item, array, index)
    return index
  }
  const mid = Math.floor((left + right) / 2)
  if (leq(item, array, array[mid])) {
    return binaryApplyRecursive(array, left, mid - 1, item, leq, operation)
  } else {
    return binaryApplyRecursive(array, mid + 1, right, item, leq, operation)
  }
}
