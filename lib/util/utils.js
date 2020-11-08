'use strict'

module.exports = {
  toIterable,
  toArray,
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
