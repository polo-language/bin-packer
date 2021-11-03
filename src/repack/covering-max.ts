import { NoSolutionError } from '../index'
import { findIndexFromRight, modulo } from '../util/utils'
import { Item } from './item'

/**
 * Expresses a one-dimensional range, both endpoints inclusive.
 * Represents a single value when both endpoints are equal.
 */
export class Range<T> {
  constructor(readonly low: T, readonly high: T, readonly minIsOptimal: boolean = true) {
    if (high < low) {
      throw new Error(`Range initialized with low ${low} greater than high ${high}`)
    }
  }

  static integralContraction(original: Range<number>): Range<number> {
    return new Range(Math.ceil(original.low), Math.floor(original.high), original.minIsOptimal)
  }
}

/**
 * Picks out a collection of items that meets the range requirements.
 * Assumes items are sorted by size ascending.
 * Returns the items' indexes.
 * */
export function selectRangeCovering(
    items: readonly Item[], sizeRange: Range<number>, countRange: Range<number>) : number[] {
  if (sizeRange.minIsOptimal) {
    throw new Error(`Optimize for min size is not implemented, see covering/selectCovering`)
  }
  if (countRange.minIsOptimal) {
    throw new Error(`Optimize for min count is not implemented`)
  }
  if (sizeRange.high < 0 || countRange.high < 1) {
    throw new Error(`Max size ${sizeRange.high} must be non-negative, max count `
        +`${countRange.high} must be at least 1`)
  }
  // Don't try to use more items than there are. Ensure integral endpoints.
  countRange = Range.integralContraction(new Range(
      Math.max(0, countRange.low),
      Math.min(items.length, countRange.high),
      countRange.minIsOptimal))
  // TODO: Helpful to set negative low size to min of zero?
  if (items.length < countRange.low) {
    throw new Error(`Total items ${items.length}, less than than min count ${countRange.low}`)
  }
  // The next two conditions ensure that range of valid coverings overlaps with the provided ranges,
  // but the ranges may still not be large enough to contain any possible combinations. E.g.
  // items: {1, 100}, sizeRange: [5, 10], countRange: [1, 2], possible subsets: {1, 100, 101} - 
  // sizeRange is entirely contained in the subset range, but no subset sum fall in the sizeRange.
  if (sizeRange.high < Item.sizeOf(items.slice(0, countRange.low))) {
    throw new NoSolutionError(`No possible covering: smallest ${countRange.low} items larger than `+
        `max size ${sizeRange.high}`)
  }
  if (Item.sizeOf(items.slice(items.length - countRange.high, items.length)) < sizeRange.low) {
    throw new NoSolutionError(`No possible covering: largest ${countRange.high} items smaller `+
        `than min size ${sizeRange.low}`)
  }
  const targetCount = countRange.minIsOptimal ? countRange.low : countRange.high
  let indexes = indexesNear(
      items,
      targetCount,
      (sizeRange.minIsOptimal ? sizeRange.low : sizeRange.high) / targetCount,
      sizeRange.minIsOptimal)
  if (!sizeRange.minIsOptimal && !countRange.minIsOptimal) {
    // Always true for now.
    indexes = preventMax(items, indexes, sizeRange, countRange)
  }
  return toMoreExtreme(items, indexes, sizeRange.high, false)
}

/**
 * Returns the indexes of the smallest/largest count items each of whose size is larger/smaller
 * than itemSizeTarget, or the largest/smallest items available if there there aren't count items
 * larger/smaller than itemSizeTarget.
 * Assumes items are sorted by size, ascending.
 * 
 * Together with the min/max size checks in selectRangeCovering, ensures the total is
 * 1) over the min size unless isTargetMin and count was chosen lower than the max, and
 * 2) under the max size unless !isTargetMin and count was chosen higher than the min.
 */ 
function indexesNear(
    items: readonly Item[],
    count: number,
    itemSizeTarget: number,
    isTargetMin: boolean): number[] {
  if (count <= 0 || items.length < count) {
    throw new Error(`Unable to select ${count} items from a list of length ${items.length}`)
  }
  const firstIndex = isTargetMin ?
      items.findIndex(item => itemSizeTarget < item.size) :
      findIndexFromRight(items, item => item.size < itemSizeTarget)
  const startingIndex = firstIndex !== -1 ?
      firstIndex :
      isTargetMin ? items.length : 0
  const outsideCount = Math.min(count, isTargetMin ? items.length - startingIndex : startingIndex)
  const insideCount = count - outsideCount
  return Array(count)
      .fill(startingIndex - (isTargetMin ? insideCount : outsideCount))
      .map((val, index) => val + index)
}

/**
 * Modifies indexes in place by potentially removing indexes from the left or right until the total
 * size of items indexed is no greater than sizeRange.high. Never drops the sum below sizeRange.low.
 * 
 * Assumes indexes is non-empty and contains sequential integer indexes into items.
 * If sizeRange.high has already been exceeded, then assumes indexes are the lowest possible.
 * Returns indexes for convenience.
 *
 * Only to be called when size is to be maximized and countRange.low < indexes.length, i.e. when
 * both size and count ranges are to be maximized.
 */
function preventMax(
    items: readonly Item[],
    indexes: readonly number[],
    sizeRange: Range<number>,
    countRange: Range<number>) : number[] {
  const currentTotal = Item.sizeOf(indexes.map(index => items[index]))
  // Figure out how many to take off of the right to get under max.
  let totalFromRight = currentTotal
  // lastRemovedRight is also the number of items remaining after removing from the right
  const lastRemovedRight = findIndexFromRight(indexes, index => {
    totalFromRight -= items[index].size
    return countRange.low <= index &&
        sizeRange.low <= totalFromRight &&
        totalFromRight <= sizeRange.high
  })
  // Figure out how many to take off of the left to get under max.
  let totalFromLeft = currentTotal
  const lastRemovedLeft = indexes.findIndex(index => {
    // index === iteration index
    totalFromLeft -= items[index].size
    return countRange.low <= indexes.length - (index + 1) &&
        sizeRange.low <= totalFromLeft &&
        totalFromLeft <= sizeRange.high
  })
  if (lastRemovedRight < 1) {
    if (lastRemovedLeft === -1 || lastRemovedLeft === indexes.length - 1) {
      throw new NoSolutionError(`No items in count range are less than the maximum`)
    } else {
      // Only possible to get here if removing from the right dropped the sum below sizeRange.low.
      return indexes.slice(lastRemovedLeft + 1, indexes.length)
    }
  } else {
    if (lastRemovedLeft === -1 || lastRemovedLeft === indexes.length - 1) {
      return indexes.slice(0, lastRemovedRight)
    } else {
      return indexes.slice(lastRemovedLeft + 1, indexes.length)
    }
  }
}

/**
 * Walks the indexes down/up round-robin until decreasing/increasing any index would cause the total
 * size of indexed items to be less/greater than limit.
 * Assumes items and indexes are sorted ascending.
 * Returns indexes for convenience.
 */
function toMoreExtreme(items: readonly Item[], indexes: number[], limit: number, isMin: boolean)
    : number[] {
  if (indexes.length < 1) {
    throw new Error(`Algorithm error: Empty indexes array`)
  }
  let currentTotal = Item.sizeOf(indexes.map(index => items[index]))
  if (isMin ? currentTotal < limit : limit < currentTotal) {
    throw new Error(`Selected items' total size ${currentTotal} must already be no `
        +`${isMin ? 'less' : 'greater'} than the limit ${limit}`)
  }
  let failures = 0
  let nextIndex = isMin ? 0 : indexes.length - 1
  while (failures < indexes.length) {
    if (indexes[nextIndex] === (isMin ? 0 : items.length - 1)) {
      // No more extreme items to swap with.
      ++failures
      continue
    }
    if (isMin ?
        0 < nextIndex && indexes[nextIndex - 1] === indexes[nextIndex] - 1 :
        nextIndex < indexes.length - 1 && indexes[nextIndex + 1] === indexes[nextIndex] + 1) {
      // Don't increment failures just because this index had no place to go. If all indexes end up
      // stacked up next to each other, failures will still keep accruing at the extreme index.
      continue
    }
    const swapDifference =
        items[indexes[nextIndex] + (isMin ? -1 : 1)].size - items[indexes[nextIndex]].size
    if (isMin ? currentTotal + swapDifference < limit : limit < currentTotal + swapDifference) {
      // That would be too extreme.
      ++failures
      continue
    }
    failures = 0
    indexes[nextIndex] += isMin ? -1 : 1
    currentTotal += swapDifference
    // Increment to nextIndex is different here: cycle up for isMin, down otherwise.
    nextIndex = modulo(nextIndex + (isMin ? 1 : -1), indexes.length)
  }
  return indexes
}
