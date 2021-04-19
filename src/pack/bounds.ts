import { BoundOutput } from '../index';
import * as utils from '../util/utils'

/**
 * A simple-to-compute lower bound on the number of bins required by an optimal
 * solution. Computes the nubmer of bins required if elements' sizes could be
 * split across bins to fill each completely before opening a new one.
 * @returns An object with two keys: 'bound' giving the lower bound and
 *          'oversized' giving the number of oversized items.
 */
export function lowerBound1<T>(
    obj: T[]|Iterable<T>|object,
    sizeOf: (t: T) => number,
    capacity: number)
        : BoundOutput {
  const {array: array, oversized: oversized} = utils.prepareValues(obj, sizeOf, capacity)
  return {
    'bound': Math.ceil(utils.sum(array, sizeOf) / capacity),
    'oversized': oversized.length,
  }
}

/**
 * Martello and Toth's L2 lower bound on the number of bins required by an
 * optimal solution. Combines the methodology of the L1 lower bound with the
 * addition of a 'waste' component for each bin that can be shown not to be
 * fully fillable.
 * @returns An object with two keys: 'bound' giving the lower bound and
 *          'oversized' giving the number of oversized items.
 */
export function lowerBound2<T>(
    obj: T[]|Iterable<T>|object,
    sizeOf: (t: T) => number,
    capacity: number)
        : BoundOutput {
  const {array: array, oversized: oversized} = utils.prepareValues(obj, sizeOf, capacity)
  return {
    'bound': lowerBound2Sorted(utils.sortAscending(array, sizeOf), sizeOf, capacity),
    'oversized': oversized.length,
  }
}

/**
 * Assumes {@link sortedArray} contains no oversized items and is sorted ascending.
 * Consumes {@link sortedArray}.
 */
export function lowerBound2Sorted<T>(sortedArray: T[],
    sizeOf: (t: T) => number,
    capacity: number)
        : number {
  // Calculates the total as it visits each element.
  let waste = 0
  let carry = 0
  let elementTotal = 0
  const constSizeOf = sizeOf // const for linter.
  while (sortedArray.length > 0) {
    const largestSize = sizeOf(sortedArray.pop()!)
    elementTotal += largestSize
    const remainder = capacity - largestSize
    const firstLargerThanRemainder = sortedArray.findIndex(function (element) {
      return constSizeOf(element) > remainder
    })
    const smallerCount = firstLargerThanRemainder === -1 ?
        sortedArray.length :
        firstLargerThanRemainder // Not an off-by-one error :)
    const smallerTotal = smallerCount > 0 ?
        utils.sum(sortedArray.splice(0, smallerCount), sizeOf) :
        0
    elementTotal += smallerTotal
    carry += smallerTotal
    if (remainder < carry) {
      carry -= remainder
    } else if (remainder > carry) {
      waste += remainder - carry
      carry = 0
    }
  }
  return Math.ceil((waste + elementTotal) / capacity)
}
