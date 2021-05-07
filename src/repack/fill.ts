import { Item, Bin }  from '../common'
import { binaryApply, groupByBoolean, pushFrom } from '../util/utils'

/**
 * Adds newItems to bins. Returns any items that could not be placed.
 * @param bins        Modifies the bins in place. No bins are added or removed, but the order and
 *                    contents will be changed.
 * @param newItems    Items to be added to bins.
 */
export function greedyFillMaxSkipNonFitting(bins: readonly Bin[], newItems: Item[]): Item[] {
  const [fullBins, openBins] = groupByBoolean(bins, bin => bin.isOpen())
  const nonFittingItems: Item[] = []
  const insertToExisting = (item: Item, array: Bin[], i: number) => {
    if (i === array.length) {
      // Item is too large to fit in any bin.
      nonFittingItems.push(item)
    } else {
      array[i].add(item)
    }
  }
  newItems.sort((a, b) => b.size - a.size)
  sortAscendingFreeSpace(openBins)
  for (const item of newItems) {
    // Insert into bin with smallest free space that can accept item.
    const binIndex = binaryApply(openBins, item, itemFits, insertToExisting)
    if (binIndex < openBins.length) {
      // (Otherwise item was added to nonFittingItems, no bins were modified.)
      if (openBins[binIndex].isOpen()) {
        // Move updated bin to preserve sort
        binaryApply(openBins, binIndex, hasLessFreeSpace, binResort)
      } else {
        pushFrom(binIndex, openBins, fullBins)
      }
    }
  }
  return nonFittingItems
}

/**
 * Adds newItems to bins. Errors out if any item can not be placed.
 * @param bins        Modifies the bins in place. No bins are added or removed, but the order and
 *                    contents will be changed.
 * @param newItems    Items to be added to bins.
 */
export function greedyFillMaxFailNonFitting(bins: readonly Bin[], newItems: Item[]) {
  const [fullBins, openBins] = groupByBoolean(bins, bin => bin.isOpen())
  newItems.sort((a, b) => b.size - a.size)
  sortAscendingFreeSpace(openBins)
  for (const item of newItems) {
    // Insert into bin with smallest free space that can accept item.
    const binIndex = binaryApply(openBins, item, itemFits, insertItem)
    if (openBins[binIndex].isOpen()) {
      // Move updated bin to preserve sort
      binaryApply(openBins, binIndex, hasLessFreeSpace, binResort)
    } else {
      pushFrom(binIndex, openBins, fullBins)
    }
  }
}

// Only comparing freeSpace since bins with no slots aren't members of the array from which
// arrayElement is pulled.
function itemFits(item: Item, _: Bin[], arrayElement: Bin): boolean {
  return item.size <= arrayElement.freeSpace
}

function insertItem(item: Item, array: Bin[], i: number) {
  if (i === array.length) {
    throw new Error(`Item ${item.id} with size ${item.size} does not fit in any bin`)
  }
  array[i].add(item)
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