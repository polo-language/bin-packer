import { Item, Bin }  from './common'
import * as utils from './utils'

export function eliminateBins(bins: Bin[], idsToEliminate: number[]): Bin[] {
  const [openBins, fullBins, itemsToMove] = bins.reduce(
    (acc: [Bin[], Bin[], Item[]], bin: Bin) => {
      if (idsToEliminate.includes(bin.id)) {
        Array.prototype.push.apply(acc[2], bin.items)
      } else if (bin.hasOpening()) {
        acc[0].push(bin)
      } else {
        acc[1].push(bin)
      }
      return acc
    }
    , [[], [], []]
  )

  // Collect some metrics
  const freeSpace = openBins.reduce(
      (acc: number, bin: Bin) => acc + bin.freeSpace, 0)
  const toMoveTotalSize = itemsToMove.reduce((acc: number, item: Item) => acc + item.size, 0)

  if (freeSpace < toMoveTotalSize) {
    throw new Error(`There is only ${freeSpace} total free space in the retained bins but ` +
        `${toMoveTotalSize} total size to be moved by eliminating bins`)
  }
  // Note it's possible there still isn't enough space since items can't be broken across bins to
  // fill all available free space.

  // Run the algorithm
  // TODO: Switch/iterate algorithms based on metrics and/or initial success.
  // const repackedBins = greedyMaxout(openBins, itemsToMove).concat(fullBins)
  const repackedBins = doNothing(openBins, itemsToMove).concat(fullBins)
  
  // Quality control
  utils.itemAccounting(bins, repackedBins)
  utils.validateBins(bins)

  return repackedBins
}

// Output will not pass validation!
function doNothing(bins: Bin[], itemsToMove: Item[]): Bin[] {
  return bins
}

function greedyMaxout(bins: Bin[], itemsToMove: Item[]): Bin[] {
  itemsToMove.sort((a, b) => b.size - a.size)
  for (const item in itemsToMove) {
    sortAscendingFreeSpace(bins)
    // TODO: Find bin with smallest free space that can accept item.
  }
  return bins
}

/** In-place sort. */
function sortAscendingFreeSpace(bins: Bin[]) {
  bins.sort((a, b) => a.freeSpace - b.freeSpace)
}
