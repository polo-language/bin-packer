import { MoveCallback } from '../index'
import { Bin }  from '../repack/bin'
import { Item }  from '../repack/item'
import { groupByThree, pushFrom } from '../util/utils'
import { binaryApply } from '../util/binary-apply'
import * as SortUtils from './sort-utils'

/**
 * Moves items from bins that are over capacity to bins that are both under capacity and have free
 * slots.
 */
export function shiftOverfull(bins: readonly Bin[], moveCallback?: MoveCallback): void {
  // Full here means neither overfull nor fully open. Hence, either exactly space utilized and/or
  // no open slots.
  const [overBins, openBins, fullBins] =  groupByThree(bins, bin => {
    if (bin.isOverfull()) {
      return 0
    } else if (bin.isOpen()) {
      return 1
    } else {
      return 2
    }
  })
  // Sort most to least overutilized
  overBins.sort((a, b) => b.overfill - a.overfill)
  // Sort least to most freespace
  openBins.sort((a, b) => a.freeSpace - b.freeSpace)
  let skippedBinCount = 0
  while (overBins.length > skippedBinCount) {
    if (openBins.length < 1) {
      // The remaining overutilized bins will need to swap out items.
      return
    }
    const mostOverutilizedBin = overBins[skippedBinCount]
    const toMove =
        mostOverutilizedBin.largestFromOverfill(openBins[openBins.length - 1].freeSpace)
    if (null === toMove) {
      ++skippedBinCount
    } else {
      // Will always find a target bin because itemToMove was restricted to being smaller than the
      // free space of the bin with the most free space.
      const targetBinIndex = openBins.findIndex(bin => toMove.size <= bin.freeSpace)
      const targetBin = openBins[targetBinIndex]
      mostOverutilizedBin.moveOut(toMove.index, targetBin, 'shiftOverfull', true, moveCallback)
      if (!targetBin.isOpen()) {
        pushFrom(targetBinIndex, openBins, fullBins)
      } else {
        binaryApply(
            openBins, targetBinIndex, SortUtils.hasLessFreeSpaceByIndex, SortUtils.moveWithin)
      }
      if (mostOverutilizedBin.isOpen()) {
        // Splice mostOverutilizedBin out this time.
        const mostOverutilizedBin = overBins.splice(skippedBinCount, 1)[0]
        binaryApply(openBins, mostOverutilizedBin, SortUtils.hasLessFreeSpace, SortUtils.spliceOne)
      } else if (!mostOverutilizedBin.isOverfull()) {
        pushFrom(skippedBinCount, overBins, fullBins)
      } else {
        binaryApply(
            overBins, skippedBinCount, SortUtils.hasMoreOverfillByIndex, SortUtils.moveWithin)
      }
    }
  }
}

/**
 * "Moves" as many slots as possible from bins with open slots to bins with space that have no open
 * slots.
 *
 * Returns how many items were moved.
 */
export function shiftSlots(
    bins: readonly Bin[], sizeThreshold: number, moveCallback?: MoveCallback): number {
  const [slotsBins, spaceBins, otherBins] = groupByThree(bins, bin => {
    if (bin.freeSlots > 0) {
      return 0
    } else if (bin.freeSpace > 0) {
      return 1
    } else {
      return 2
    }
  })
  return slotsBins.length > 0 && spaceBins.length > 0 ?
      shiftToOpenSlots(spaceBins, slotsBins, otherBins, sizeThreshold, moveCallback) :
      0
}

/**
 * Attempts to move as many items as possible from bins in spaceBins into free slots in bins in
 * slotsBins. Counterintuitively this moves items out of the bins that currently have space, but the
 * result is that the bins with space "receive" open slots, preparing them to be filled (presumably
 * more space-efficiently than prior to the shift) by some other algorithm.
 *
 * All bins in slotsBins should have positive free slots. When this no longer holds, it is moved to
 * otherBins. To prevent accumulating all free slots in the bin with most free space (since space
 * bins can only increase in free space by losing items), bins in spaceBins are paired up
 * round-robin with bins in slotsBins.
 *
 * Returns how many items were moved.
 */
function shiftToOpenSlots(
    spaceBins: Bin[],
    slotsBins: Bin[],
    otherBins: Bin[],
    sizeThreshold: number,
    moveCallback?: MoveCallback): number {
  if (spaceBins.length < 1) {
    throw new Error('Algorithm error: Can not shift items from no bins')
  }
  // Most free slots to least.
  slotsBins.sort((a, b) => b.freeSlots - a.freeSlots)
  // Most free space to least.
  spaceBins.sort((a, b) => b.freeSpace - a.freeSpace)
  let skippedBinCount = 0
  let totalMoved = 0
  while (skippedBinCount < slotsBins.length) {
    const numMoved =
        shiftFromOne(skippedBinCount, spaceBins, slotsBins, otherBins, sizeThreshold, moveCallback)
    if (0 < numMoved) {
      totalMoved += numMoved
    } else {
      ++skippedBinCount
    }
  }
  return totalMoved
}

/**
 * Moves items into slotsBin from one bin in spaceBins, if possible.
 * Returns how many items were moved.
 */
function shiftFromOne(
    slotsIndex: number,
    spaceBins: Bin[],
    slotsBins: Bin[],
    otherBins: Bin[],
    sizeThreshold: number,
    moveCallback?: MoveCallback): number {
  const slotsBin = slotsBins[slotsIndex]
  for (let spaceIndex = 0; spaceIndex < spaceBins.length; ++spaceIndex) {
    const spaceBin = spaceBins[spaceIndex]
    const allSourceItems = spaceBin.items
    const n = findMaxCount(allSourceItems, slotsBin.freeSpace, slotsBin.freeSlots)
    if (0 < n) {
      // Find items to shift and shift them.
      const decreasingIndexesToMove =
          findApproxLargestIndexes(allSourceItems, slotsBin.freeSpace, n)
          .reverse()
      // Only execute the moves if the bin receiving the slots will end up with enough space.
      const afterSpace = spaceBin.freeSpace + decreasingIndexesToMove.reduce(
          (acc, index) => acc + allSourceItems[index].size, 0)
      if (sizeThreshold <= afterSpace) {
        for (const index of decreasingIndexesToMove) {
          spaceBin.moveOut(index, slotsBin, 'shiftSlots', true, moveCallback)
        }
        // Re-sort modified slotsBin.
        if (slotsBin.freeSlots < 1) {
          const removed = slotsBins.splice(slotsIndex, 1)
          if (removed.length != 1 || removed[0] !== slotsBin) {
            throw new Error(`Algorithm error: Removed wrong slotsBin when moving to otherBins`)
          }
          otherBins.push(slotsBin)
        } else {
          binaryApply(slotsBins, slotsBin, SortUtils.hasMoreFreeSlots, SortUtils.spliceOne)
        }
        // Move the "slot receiving" bin to the end of the array so it will be the last checked in
        // the next round.
        pushFrom(spaceIndex, spaceBins, spaceBins)
        return decreasingIndexesToMove.length
      }
    }
  }
  return 0
}

/**
 * Finds the largest number of items less than maxCount that have total size less than or equal to
 * maxSize.
 * Assumes items are ordered increasing by size, which is true of Bin items.
 */
function findMaxCount(items: Item[], maxSize: number, maxCount: number): number {
  const selected = items.slice(0, Math.min(items.length, maxCount))
  for (
      let selectedSize = Item.sizeOf(selected);
      0 < selected.length && maxSize < selectedSize;
      selectedSize -= selected.pop()!.size // eslint-disable-line @typescript-eslint/no-non-null-assertion
  ) { /* do nothing */ }
  return selected.length
}

/**
 * Finds the set of count items of approximately largest total size less than or equal to maxSize.
 * Throws if no such set exists. Establish the correct count beforehand with findMaxCount.
 * Assumes items are ordered increasing by size, which is true of Bin items.
 */
function findApproxLargestIndexes(items: Item[], maxSize: number, count: number): number[] {
  if (count < 1) {
    throw new Error(`Algorithm error: Can not generate set of size ${count} < 1`)
  }
  const selectedIndexes = Array.from(Array(count).keys())
  selectedIndexes.push(Infinity) // "Index" of the "next item" after the largest selected item.
  let selectedSize = Item.sizeOf(items.slice(0, count))
  if (maxSize < selectedSize) {
    throw new Error(`Algorithm error: No ${count} items have total size smaller than ${maxSize}`)
  }
  // Start at the true largest item index, not at the dummy index at infinity.
  for (let indexIndex = count - 1; 0 <= indexIndex; --indexIndex) {
    const nextIndex = selectedIndexes[indexIndex + 1]
     // Keep incrementing the item index at this selected index until it bumps up against its
     // neighbor or causes the total sum to be too large.
    for (let index = selectedIndexes[indexIndex];
        index + 1 < nextIndex && index + 1 < items.length;
        ++index) {
      const swapSizeDifference = items[index + 1].size - items[index].size
      if (selectedSize + swapSizeDifference <= maxSize) {
        // Swap item at index for item at index + 1.
        ++selectedIndexes[indexIndex]
        selectedSize += swapSizeDifference
      } else {
        // Break from inner for loop at this indexIndex. Work on the next smaller indexIndex.
        break
      }
    }
  }
  selectedIndexes.pop() // Remove the dummy index at infinity.
  return selectedIndexes
}

export function unshiftMoves(bins: readonly Bin[], moveCallback?: MoveCallback): void {
  const binMap = new Map<string, Bin>(bins.map(bin => [bin.id, bin]))
  while (unshiftMovesOnce(binMap, moveCallback)) { /* do nothing */ }
}

function unshiftMovesOnce(binMap: Map<string, Bin>, moveCallback?: MoveCallback): boolean {
  let anyMoved = false
  for (const bin of Array.from(binMap.values())) {
    const items = bin.items
    // Proceed last to first so we can remove items without changing the index of subsequent items.
    for (let i = items.length - 1; 0 <= i; --i) {
      const item = items[i]
      if (item.originalBinId !== undefined && item.hasMoved()) {
        const originalBin = binMap.get(item.originalBinId)
        if (originalBin !== undefined &&
            0 < originalBin.freeSlots &&
            item.size <= originalBin.freeSpace) {
          bin.moveOut(i, originalBin, 'unshiftMoves', true, moveCallback)
          anyMoved = true
        }
      }
    }
  }
  return anyMoved
}
