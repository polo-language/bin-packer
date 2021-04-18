/**
 * Returns an object containing the input as an array less any oversized items, which are moved to
 * a second array. Throws if {@link sizeOf} does not return a number for any value of {@link obj}.
 */
export function prepareValues<T>(
    obj: T[]|Iterable<T>|object,
    sizeOf: ((t: T) => number),
    capacity: number)
        : {array: T[], oversized: T[]} {
  if (validateNumber(capacity, 'capacity') <= 0) {
    throw new Error('Capacity must be a positive number')
  }
  const array = toArray(obj)
  const oversized: T[] = []
  const oversizedIndexes: number[] = []
  const iter = array.entries()
  let nextObj = iter.next()
  while (!nextObj.done) {
    const index = nextObj.value[0]
    const element = nextObj.value[1]
    const size = sizeOf(element)
    validateNumber(size, index)
    if (size > capacity) {
      oversized.push(element)
      oversizedIndexes.push(index)
    }
    nextObj = iter.next()
  }
  for (const index of oversizedIndexes.reverse()) {
    array.splice(index, 1)
  }
  return {array: array, oversized: oversized,}
}

export function toArray<T>(obj: T[]|Iterable<T>|object): T[] {
  if (Array.isArray(obj)) {
    return obj
  } else {
    return Array.from(toIterable(obj))
  }
}

/**
 * Converts its argument to an interable if it is not one already.
 * In particular, if it is a non-iterable object, returns an array of the object's own innumerable
 * property values.
 * @param {Iterable|object} obj
 */
function toIterable<T>(obj: Iterable<T>|object): Iterable<T> {
  if (obj !== null) {
    if (isIterable(obj)) {
      return obj
    } else if (typeof obj === 'object') {
      return Object.values(obj)
    }
  }
  throw new Error('Must be either iterable or a non-function object')
}

/** Returns whether {@link obj} is iterable. */
function isIterable<T>(obj: any): obj is Iterable<T> {
  return typeof obj[Symbol.iterator] === 'function'
}

/**
 * Throws if {@link num} is not a {@link number}.
 * @returns {number}    The input {@link num} for chaining.
 */
function validateNumber(num: number, context: any): number {
  if (num === null || num === undefined || typeof num !== 'number') {
    throw new Error(`Expected a number for ${context}`)
  } else {
    return num
  }
}

/** Sorts descending in-place. Returns the array argument for convenience. */
export function sortDescending<T>(array: T[], sizeOf: ((t: T) => number)): T[] {
  return array.sort((left, right) => sizeOf(right) - sizeOf(left))
}

/** Sorts ascending in-place. Returns the array argument for convenience. */
export function sortAscending<T>(array: T[], sizeOf: ((t: T) => number)): T[] {
  return array.sort((left, right) => sizeOf(left) - sizeOf(right))
}

export function sum<T>(array: T[], sizeOf: ((t: T) => number)): number {
  return array.reduce((acc, cur) => acc += sizeOf(cur), 0)
}
/**
 * Performs a recursive binary search to find the index at which to apply {@param operation}.
 * The {@param array} is assumed to be sorted according to {@param leq} in relation to objects of
 * the same type as {@param item}, a property which {@param operation} is required to preserve.
 * Modifies {@param array}.
 * @param {array} array         A sorted array
 * @param {*} item              The item to be 'inserted' into the array. May not be of the same
 *                              type as the array elements. E.g. each array element may be an
 *                              object or array into which the item can be inserted.
 * @param {function} leq        (item, array, arrayElement) => whether item is '<=' arrayElement.
 * @param {function} operation  (item, array, i) => void. i is index in array where item is to
 *                              be applied. Expected to modify array in-place.
 * @returns {number}            The index at which operation applied item to array.
 */
 export function binaryApply<T, U>(
    array: T[],
    item: U,
    leq: (item: U, array: T[], arrayElement: T) => boolean,
    operation: (item: U, array: T[], i: number) => void)
        : number {
  return binaryApplyRecursive(array, 0, array.length - 1, item, leq, operation)
}

function binaryApplyRecursive<T, U>(
    array: T[],
    left: number,
    right: number,
    item: U,
    leq: (item: U, array: T[], arrayElement: T) => boolean,
    operation: (item: U, array: T[], i: number) => void)
        : number {
  if (left > right) {
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
