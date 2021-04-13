import { Item, Bin }  from './common'
import { binaryApply } from './utils'

/**
 * Adds newItems to bins.
 * @param bins        Modifies the bins in place. No bins are added or removed, but the order and
 *                    contents will be changed.
 * @param newItems    Items to be added to bins.
 */
export function greedyFillMax(bins: Bin[], newItems: Item[]) {
  newItems.sort((a, b) => b.size - a.size)
  sortAscendingFreeSpace(bins)
  for (const item of newItems) {
    // Insert into bin with smallest free space that can accept item.
    const binIndex = binaryApply(bins, item, itemFits, insertItem)
    // Move updated bin to preserve sort
    binaryApply(bins, binIndex, hasLessFreeSpace, binResort)
  }
}

function itemFits(item: Item, _: Bin[], arrayElement: Bin): boolean {
  return item.size <= arrayElement.freeSpace
}

function insertItem(item: Item, array: Bin[], i: number) {
  if (i === array.length) {
    throw new Error(`Item ${item.id} with size ${item.size} does not fit in any bin`)
  }
  const bin = array[i]
  bin.add(item)
  item.newBinId = bin.id
}

// Item is an index into array.
function hasLessFreeSpace(item: number, array: Bin[], arrayElement: Bin): boolean {
  return array[item].freeSpace <= arrayElement.freeSpace
}

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
