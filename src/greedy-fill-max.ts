import { Item, Bin }  from './common'
import { binaryApply } from './utils'

export function greedyFillMax(openBins: Bin[], overfullBins: Bin[], newItems: Item[]): Bin[] {
  // Temporary
  if (overfullBins.length > 0) {
    throw new Error('Moving items fom overfull bins is not yet supported.')
  }

  newItems.sort((a, b) => b.size - a.size)
  sortAscendingFreeSpace(openBins)
  for (const item of newItems) {
    // Insert into bin with smallest free space that can accept item.
    const binIndex = binaryApply(openBins, item, itemFits, insertItem)
    // Move updated bin to preserve sort
    binaryApply(openBins, binIndex, hasLessFreeSpace, binResort)
  }
  return openBins
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
