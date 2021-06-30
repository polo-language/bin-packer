import { InputObject } from "../index"

/**
 * Returns an object containing the input as an array less any oversized items, which are moved to
 * a second array. Throws if {@link sizeOf} does not return a number for any value of {@link obj}.
 */
export function prepareValues<T>(
    obj: InputObject<T>,
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

/**
 * Returns the input object converted to an array.
 * Throws if {@link sizeOf} does not return a number for any value of {@link obj}.
 */
export function prepareValuesNoCapacity<T>(obj: InputObject<T>, sizeOf: ((t: T) => number)): T[] {
  const array = toArray(obj)
  const iter = array.entries()
  for (let nextObj = iter.next(); !nextObj.done; nextObj = iter.next()) {
    const index = nextObj.value[0]
    const element = nextObj.value[1]
    validateNumber(sizeOf(element), index)
  }
  return array
}

export function toArray<T>(obj: InputObject<T>): T[] {
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
 */
function toIterable<T>(obj: Iterable<T> | { [index: string]: T }): Iterable<T> {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
export function isIterable<T>(obj: any): obj is Iterable<T> {
  return typeof obj[Symbol.iterator] === 'function'
}

/**
 * Throws if {@link num} is not a {@link number}.
 * @returns {number}    The input {@link num} for chaining.
 */
function validateNumber(num: number, context: string | number): number {
  if (num === null || num === undefined || typeof num !== 'number') {
    throw new Error(`Expected a number for ${context}`)
  } else {
    return num
  }
}

/**
 * Converts its argument to an iterable of numbers, if possible.
 * The type of values returned by iterables isn't checked so as to not consume any values.
 */
export function adaptToNumberIterable(
    capacity: number | Iterable<number> | (() => Iterable<number>)): Iterable<number> {
  // Number?
  if (typeof capacity === 'number') {
    return (function* () {
      while (true) {
        yield capacity
      }
    })()
  }
  // Iterable or Generator?
  if (isIterable(capacity)) {
    return capacity
  }
  // Generator function?
  if (typeof capacity === 'function') {
    const called = capacity()
    if (isIterable(called)) {
      return called
    }
  }
  throw new Error('Capacity must be one of: number, iterable, or generator')
}
