import { MoveCallback } from '../index'
import { Bin }  from '../repack/bin'
import { Item }  from '../repack/item'
import { groupByBoolean, pushFrom } from '../util/utils'
import { binaryApply } from '../util/binary-apply'

/**
 * Adds newItems to bins. Returns any items that could not be placed.
 * @param bins        Modifies the bins in place. No bins are added or removed, but the order and
 *                    contents will be changed.
 * @param newItems    Items to be added to bins.
 */
export function fill(bins: readonly Bin[], newItems: Item[], moveCallback?: MoveCallback): Item[] {
  const isAccepting = (bin: Bin) => 0 < bin.freeSlots && 0 <= bin.freeSpace
  const [fullBins, acceptingBins] = groupByBoolean(bins, isAccepting)
  const nonFittingItems: Item[] = []
  const insertToExisting = (item: Item, array: Bin[], i: number) => {
    if (i === array.length) {
      // Item is too large to fit in any bin.
      nonFittingItems.push(item)
    } else {
      array[i].moveIn(item, 'fill', undefined, undefined, moveCallback)
    }
  }
  newItems.sort((a, b) => b.size - a.size)
  sortAscendingFreeSpace(acceptingBins)
  for (const item of newItems) {
    // Insert into bin with smallest free space that can accept item.
    const binIndex = binaryApply(acceptingBins, item, itemFits, insertToExisting)
    if (binIndex < acceptingBins.length) {
      // (Otherwise item was added to nonFittingItems, no bins were modified.)
      if (isAccepting(acceptingBins[binIndex])) {
        // Move updated bin to preserve sort
        binaryApply(acceptingBins, binIndex, hasLessFreeSpace, binResort)
      } else {
        pushFrom(binIndex, acceptingBins, fullBins)
      }
    }
  }
  return nonFittingItems
}

// Only comparing freeSpace since bins with no slots aren't members of the array from which
// arrayElement is pulled.
function itemFits(item: Item, _: Bin[], arrayElement: Bin): boolean {
  return item.size <= arrayElement.freeSpace
}

// Item is an index into array.
function hasLessFreeSpace(item: number, array: Bin[], arrayElement: Bin): boolean {
  return array[item].freeSpace <= arrayElement.freeSpace
}

/**
 * Moves the bin at index item to the index i. Only moves bins to earlier indexes because bins
 * being moved have just had their free space decreased (possibly by zero) in an array sorted
 * ascending by free space.
 */
function binResort(item: number, array: Bin[], i: number) {
  if (i === item) {
    return
  }
  if (i > item) {
    throw new Error(`Algorithm error: newIndex ${i} > currentIndex ${item}`)
  }
  const binToMove = array[item]
  array.copyWithin(i + 1, i, item)
  array[i] = binToMove
}

/** In-place sort. */
function sortAscendingFreeSpace(bins: Bin[]) {
  bins.sort((a, b) => a.freeSpace - b.freeSpace)
}
