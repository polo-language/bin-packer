import { Item } from './item'

/**
 * Picks out the approximately smallest collection of items that meet the minimums.
 * Assumes items are sorted by size ascending.
 * */
export function selectCovering(items: readonly Item[], minSize: number, minCount: number)
    : number[] {
  // Algorithm:
  // If items size < minCount or items total size < minSize throw an error.
  // Sort items increasing by size.
  // Calculate theoretical average size of items to remove = minSizeToRemove / minCountToRemove
  // Select the smallest minCount items size each of which is larger than the average, or the
  //    largest items if there there aren't minCount items larger than the average.
  // If total selected size < minSize, then the largest minCount items must have been selected.
  //    Select the smallest single item larger or equal to the remaining size, or the largest item
  //    if no item is large enough.
  //    Repeat until total selected size >= minSize
  // If total selected size > minSize, walk items down one by one (round robbin) until minSize is
  //     undershot, then undo the last step.
  // Return the selected set.
  if (items.length < minCount || Item.sizeOf(items) < minSize) {
    throw new Error(`No possible covering of ${items.length} items with total size `+
        `${Item.sizeOf(items)} for min count ${minCount} and min size ${minSize}`)
  }
  if (minSize < 0 || minCount < 0) {
    throw new Error(`Negative values not allowed for minimum size (${minSize}) or count `+
        `(${minCount})`)
  }
  if (minCount === 0) {
    if (minSize === 0) {
      return []
    } else {
      // Set minCount to 1 since we'll need to find at least one item anyway.
      // Recurse so updated minCount passes through above validation.
      return selectCovering(items, minSize, 1)
    }
  }
  return minimizeTotal(
      items,
      ensureMin(
          items,
          indexesOfLargest(items, minCount, minSize / minCount),
          minSize),
      minSize)
}

/**
 * Returns the indexes of the smallest count items each of whose size is larger than min, or the
 * largest items available if there there aren't count items larger than min.
 * Assumes items are sorted by size, ascending.
 */ 
function indexesOfLargest(items: readonly Item[], count: number, targetItemMin: number): number[] {
  if (count <= 0 || items.length < count) {
    throw new Error(`Unable to select ${count} items from a list of length ${items.length}`)
  }
  // Alternatively to the below, could check if startingIndex <= index.length - count
  // and if so take count indexes starting at startingIndex, otherwise take the last count indexes.
  const firstLargerIndex = items.findIndex(item => targetItemMin < item.size)
  const startingIndex = firstLargerIndex === -1 ? items.length : firstLargerIndex
  const postStartCount = Math.min(count, items.length - startingIndex)
  const preStartCount = count - postStartCount
  return Array(count).fill(startingIndex - preStartCount).map((val, index) => val + index)
}

/**
 * Modifies indexes in place by potentially prepending additional indexes until the total size of
 * items indexed by indexes is at least totalMin.
 * Assumes indexes is non-empty and contains sequential integer indexes into items.
 * If totalMin is not already acheived, then assumes indexes are the highest indexes of items.
 * Assumes items contains enough total item size to satisfy totalMin and may fail with an array
 * index out of bound error otherwise.
 * Returns indexes for convenience.
 */
function ensureMin(items: readonly Item[], indexes: number[], totalMin: number): number[] {
  let currentTotal = Item.sizeOf(indexes.map(index => items[index]))
  if (currentTotal < totalMin && indexes[indexes.length - 1] !== items.length - 1) {
    throw new Error(`If items indexed by indexes are not yet large enough, they should have been `+
        `chosen to be the largest items available`)
  }
  while (currentTotal < totalMin) {
    const deficit = totalMin - currentTotal
    const firstSmaller = items.findIndex(item => deficit < item.size)
    const nextI = firstSmaller === -1 || indexes[0] <= firstSmaller ? indexes[0] - 1 : firstSmaller
    indexes.unshift(nextI)
    currentTotal += items[nextI].size
  }
  return indexes
}

/**
 * Walks the indexes down round-robin until decreasing an index would cause the total size of items
 * indexed by indexes to be less than totalMin.
 * Assumes items and indexes are sorted ascending.
 * Returns indexes for convenience.
 */
function minimizeTotal(items: readonly Item[], indexes: number[], totalMin: number): number[] {
  let currentTotal = Item.sizeOf(indexes.map(index => items[index]))
  if (currentTotal < totalMin) {
    throw new Error(`Selected items size (${currentTotal}) must already be at least the target `+
        `minimum ${totalMin}`)
  }
  for (let nextIndex = 0; totalMin < currentTotal; nextIndex = (nextIndex + 1) % indexes.length) {
    if (indexes[nextIndex] === 0) {
      // No more smaller items to swap with.
      break
    }
    const swapDifference = items[indexes[nextIndex] - 1].size - items[indexes[nextIndex]].size
    if (currentTotal + swapDifference < totalMin) {
      // That would be too small.
      break
    }
    indexes[nextIndex] -= 1
    currentTotal += swapDifference
  }
  return indexes
}
