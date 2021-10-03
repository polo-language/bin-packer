import { MoveCallback } from '../index'
import { findIndexFromRight, groupByThree, pushFrom } from '../util/utils'
import { Bin } from './bin'
import { Item } from './item'

/**
 * Move items from bins with slot overages.
 * Ideally, afterwards all bins have at most maxItems items.
 */
export function shiftOverslots(bins: readonly Bin[], moveCallback?: MoveCallback): void {
  // Split bins into: slot overage, slot underage && space underage, and other.
  // One by one try to move items out of slot overage bins until they are no longer over.
  // Always work with the overage bin with the largest smallest item.
  // If an overage bin doesn't eliminate an item in a given pass (against all possible accepting bins), don't try it again (move it to 'other').
  // Try to place into the underage bin with the least free space. If no fit, try the next one.
  const [overBins, underBins, otherBins] = groupByThree(bins, bin => {
    if (bin.isOverslots()) {
      return 0
    } else if (bin.isOpen()) {
      return 1
    } else {
      return 2
    }
  })
  while (0 < overBins.length) {
    // Sort most free space to least.
    underBins.sort((a, b) => b.freeSpace - a.freeSpace)
    const [overBinIndex, overBin] = largestSmallest(overBins)
    let didMove = false
    for (let underIndex = 0; underIndex < underBins.length; ++underIndex) {
      const underBin = underBins[underIndex]
      const itemIndex = indexToMove(overBin.items, underBin.freeSpace, underBin.freeSlots)
      if (0 <= itemIndex) {
        overBin.moveOut(itemIndex, underBin, 'shiftOverslots', true, moveCallback)
        if (!overBin.isOverslots()) {
          pushFrom(overBinIndex, overBins, otherBins)
        }
        if (!underBin.isOpen()) {
          pushFrom(underIndex, underBins, otherBins)
        }
        didMove = true
        break // for loop
      }
    }
    if (!didMove) {
      // Don't try overBin again since we didn't find a partner for it.
      pushFrom(overBinIndex, overBins, otherBins)
    }
  }
}

function largestSmallest(bins: readonly Bin[]): [number, Bin] {
  if (bins.length < 1) {
    throw new Error(`Algorithm error: Empty array`)
  }
  const [index, _minItemSize] = bins.map(bin => bin.minItemSize).reduce((acc, val, index) =>
      val < acc[1] ? [index, val] : acc,
      [-1, Number.POSITIVE_INFINITY])
  if (index < 0) {
    throw new Error(`Algorithm error: All items have infinite size?`)
  }
  return [index, bins[index]]
}

function indexToMove(itemsAscending: Item[], freeSpace: number, freeSlots: number): number {
  if (1 < freeSlots) {
    // Use the smallest item since we may try to move more items into the other free slots.
    return itemsAscending[0].size < freeSpace ? 0 : -1
  } else {
    // Only one fillable slot, so try to use as much space as possible.
    return findIndexFromRight(itemsAscending, item => item.size <= freeSpace)
  }
}
