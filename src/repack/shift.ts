import { MoveCallback } from '../index'
import { Bin }  from '../repack/bin'
import { Item }  from '../repack/item'
import { pushFrom } from '../util/utils'
import { binaryApply } from '../util/binary-apply'
import * as SortUtils from './sort-utils'

/**
 * Moves items from bins that are over capacity to bins that are both under capacity and have free
 * slots.
 */
export function shiftOverfull(bins: readonly Bin[], moveCallback: MoveCallback): void {
  // Full here means neither overfull nor fully open. Hence, either exactly space utilized and/or
  // no open slots.
  const [overBins, openBins, fullBins] =  bins.reduce(
      (acc: [Bin[], Bin[], Bin[]], bin: Bin) => {
        if (bin.isOverfull()) {
          acc[0].push(bin)
        } else if (bin.isOpen()) {
          acc[1].push(bin)
        } else {
          acc[2].push(bin)}
        return acc
      },
      [[], [], []]
  )
  let skippedBinCount = 0
  while (overBins.length > skippedBinCount) {
    if (openBins.length < 1) {
      // The remaining overutilized bins will need to swap out items.
      return
    }
    // TODO: Keep bins sorted more efficiently.
    // Sort most to least overutilized
    overBins.sort((a, b) => b.overfill - a.overfill)
    // Sort least to most freespace
    openBins.sort((a, b) => a.freeSpace - b.freeSpace)
    const mostOverutilizedBin = overBins[skippedBinCount]
    const toMove =
        mostOverutilizedBin.largestFromOverfill(openBins[openBins.length - 1].freeSpace)
    if (null === toMove) {
      ++skippedBinCount
    } else {
      // Will always find a target bin because itemToMove was restricted to being smaller than the
      // free space of the bin with the most free space.
      const insertionBinIndex = openBins.findIndex(bin => toMove.size <= bin.freeSpace)
      const insertionBin = openBins[insertionBinIndex]
      mostOverutilizedBin.moveOut(toMove.index, insertionBin, moveCallback, 'shiftOverfull')
      if (!insertionBin.isOpen()) {
        pushFrom(insertionBinIndex, openBins, fullBins)
      }
      if (mostOverutilizedBin.isOpen()) {
        pushFrom(skippedBinCount, overBins, openBins)
      } else if (!mostOverutilizedBin.isOverfull()) {
        pushFrom(skippedBinCount, overBins, fullBins)
      }
    }
  }
}

/**
 * "Moves" as many slots as possible from bins with open slots to bins with space that have no open
 * slots.
 */
export function shiftSlots(bins: readonly Bin[], moveCallback: MoveCallback): void {
  const [slotsBins, spaceBins, otherBins] =  bins.reduce(
    (acc: [Bin[], Bin[], Bin[]], bin: Bin) => {
      if (bin.freeSlots > 0) {
        acc[0].push(bin)
      } else if (bin.freeSpace > 0) {
        acc[1].push(bin)
      } else {
        acc[2].push(bin)
      }
      return acc
    },
    [[], [], []]
  )
  if (slotsBins.length > 0 && spaceBins.length > 0) {
    shiftToOpenSlots(spaceBins, slotsBins, otherBins, moveCallback)
  }
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
 */
function shiftToOpenSlots(
    spaceBins: Bin[], slotsBins: Bin[], otherBins: Bin[], moveCallback: MoveCallback): void {
  if (spaceBins.length < 1) {
    throw new Error('Algorithm error: Can not shift items from no bins')
  }
  // Most free slots to least.
  slotsBins.sort((a, b) => b.freeSlots - a.freeSlots)
  // Most free space to least.
  spaceBins.sort((a, b) => b.freeSpace - a.freeSpace)
  let skippedBinCount = 0
  while (skippedBinCount < slotsBins.length) {
    if (!shiftFromOne(skippedBinCount, spaceBins, slotsBins, otherBins, moveCallback)) {
      ++ skippedBinCount
    }
  }
}

/**
 * Moves items into slotsBin from one bin in spaceBins, if possible.
 * Returns whether items were moved.
 */
function shiftFromOne(
    slotsIndex: number,
    spaceBins: Bin[],
    slotsBins: Bin[],
    otherBins: Bin[],
    moveCallback: MoveCallback): boolean {
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
      for (const index of decreasingIndexesToMove) {
        spaceBin.moveOut(index, slotsBin, moveCallback, 'shiftSlots')
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
      return true
    }
  }
  return false
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

export function unshiftMoves(bins: readonly Bin[], moveCallback: MoveCallback): void {
  const binMap = new Map<string, Bin>(bins.map(bin => [bin.id, bin]))
  while (unshiftMovesOnce(binMap, moveCallback)) { /* do nothing */ }
}

function unshiftMovesOnce(binMap: Map<string, Bin>, moveCallback: MoveCallback): boolean {
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
          bin.moveOut(i, originalBin, moveCallback, 'unshiftMoves')
          anyMoved = true
        }
      }
    }
  }
  return anyMoved
}
