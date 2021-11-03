import { MoveCallback, NoSolutionError } from '../index'
import { groupByThree, pushFrom, SwapPair } from '../util/utils'
import { Bin } from './bin'
import { Item } from './item'
import { Range, selectRangeCovering } from './covering-max'

/**
 * Tries to swap many items from bins with empty space for few items from bins with empty slots to
 * effectively 'move' slots into the bins with space. Afterwards, the bins that 'receive' slots
 * should still contain at least sizeThreshold free space.
 *
 * Returns whether or not any swap was made.
 */
export function slotSwap(
    bins: readonly Bin[],
    sizeThreshold: number,
    moveCallback?: MoveCallback): boolean {
  let madeASwap = false
  while (slotSwapSinglePass(bins, sizeThreshold, moveCallback)) {
    madeASwap = true
  }
  return madeASwap
}

/**
 * Tries to swap many items from bins with empty space for a single items from bins with empty slots
 * to effectively 'move' slots into the bins with space. Afterwards, the bins that 'receive' slots
 * should still contain at least sizeThreshold free space.
 *
 * Only swaps to/from a given bin once, regardless of whether or not all slots were moved out of
 * the bin originally containing slots.
 *
 * Returns whether or not any swap was made.
 */
function slotSwapSinglePass(
    bins: readonly Bin[],
    sizeThreshold: number,
    moveCallback?: MoveCallback): boolean {
  if (bins.length <= 0) {
    throw new Error(`Bins array is empty`)
  }
  const [slotBins, spaceBins, otherBins] = groupByThree(bins, bin => {
    if (0 < bin.freeSlots && bin.freeSpace < sizeThreshold) {
      return 0
    } else if (0 < bin.maxItems && bin.freeSlots <= 0 && sizeThreshold <= bin.freeSpace) {
      return 1
    } else {
      return 2
    }
  })
  // Sort max free slots to min.
  slotBins.sort((a, b) => b.freeSlots - a.freeSlots)
  // Sort max free space to min.
  spaceBins.sort((a, b) => b.freeSpace - a.freeSpace)
  // TODO: Should count slots by current positive free slots rather than net free slots?
  const totalSlots = bins.reduce((acc, bin) => acc + bin.freeSlots, 0)
  const avgFreeSlotSize = Math.round(bins.reduce(
      (acc, bin) => acc + Math.max(0, bin.freeSpace - sizeThreshold), 0) / totalSlots)
  // Cycle through spaceBins for a given slotBin. If the slot bin can't find a swap partner with
  // any space bin, discard it. If a swap is made, discard both, regardless of whether all requested
  // slots were moved. When either all slot or space bins have been discarded, stop.
  let madeASwap = false
  const slotIndex = 0
  let spaceIndex = 0
  while (0 < slotBins.length && 0 < spaceBins.length) {
    if (spaceIndex === spaceBins.length) {
      // Wasn't able to find a swap parnter for slotBin.
      pushFrom(slotIndex, slotBins, otherBins)
      spaceIndex = 0
    } else {
      const slotsBin = slotBins[slotIndex]
      const spaceBin = spaceBins[spaceIndex]
      // TODO: Should be concerned if slotsBin has space overutilization?
      if (slotSwapOne(spaceBin, slotsBin, sizeThreshold, avgFreeSlotSize, moveCallback)) {
        if (spaceBin.freeSpace < sizeThreshold) {
          throw new Error(`Algorithm error: Should not decrease a space bin below the threshold`)
        }
        // Note: Can end up with non-positive slots in spaceBin if slotsBin had fewer free slots
        // than spaceBin's slot overage. Hence not checking as an error condition.
        if (slotsBin.freeSlots < 0) {
          throw new Error(`Algorithm error: Should not introduce negative free slots in slots bin`)
        }
        // For simplicity's sake, only swap from/to a given bin once, regardless of whether or not
        // the slot swap target was met.
        pushFrom(spaceIndex, spaceBins, otherBins)
        pushFrom(slotIndex, slotBins, otherBins)
        madeASwap = true
      } else {
        // Try the next space bin as a swap partner.
        ++spaceIndex
      }
    }
  }
  return madeASwap
}

/**
 * Swap multiple items from spaceBin for a single item of slotsBin.
 * If spaceBin had at least sizeThreshold free space, this will hold true after the swap as well.
 * If slotsBin had non-negative free slots, this will hold true after the swap as well.
 * Returns whether a swap was made.
 */
function slotSwapOne(
    spaceBin: Bin,
    slotsBin: Bin,
    sizeThreshold: number,
    avgFreeSlotSize: number,
    moveCallback?: MoveCallback): boolean {
  const spaceBinTargetFreeSlots = Math.max(1, Math.round(spaceBin.freeSpace / avgFreeSlotSize))
  const moveOutCount = Math.min(slotsBin.freeSlots, spaceBinTargetFreeSlots - spaceBin.freeSlots)
  const itemsToMove = pairItems(new SwapPair(spaceBin, slotsBin), moveOutCount, sizeThreshold)
  if (itemsToMove.from.length === 0) {
    return false
  }
  for (const item of itemsToMove.from) {
    spaceBin.moveOutItem(item, slotsBin, 'slotSwap', true, moveCallback)
  }
  for (const item of itemsToMove.to) {
    slotsBin.moveOutItem(item, spaceBin, 'slotSwap', true, moveCallback)
  }
  return true
}

function pairItems(binPair: SwapPair<Bin>, netItemsToMove: number, sizeThreshold: number)
    : SwapPair<Item[]> {
  // Pair netItemsToMove + 1 'from' items with a single 'to' item.
  // Cycle through each single item in the target bin.
  // Select items that cover the size of the single target item's size, within a range that
  // prevents introducing overages, etc.
  if (netItemsToMove < 1) {
    throw new Error(`Must move at least one item, net`)
  }
  if (sizeThreshold < 0) {
    throw new Error(`Size threshold must be non-negative`)
  }
  // Want to maximize bestSwap[0], the net size moved from -> to.
  let bestSwap: [number, SwapPair<Item[]>] = [0, new SwapPair([], [])]
  // Since fromBin always has more free space than threshold, fromMaxAdditional is positive:
  const fromMaxAdditional = binPair.from.freeSpace - sizeThreshold
  // If toBin is overutilized, toMaxAdditional will be negative:
  const toMaxAdditional =  binPair.to.freeSpace
  for (const toItem of binPair.to.items) {
    // (Technically 'from' high range is max size of netItemsToMove + 1 elements of from bin.)
    const fromSizeDelta = new Range(toItem.size - fromMaxAdditional, Number.POSITIVE_INFINITY)
    const toSizeDelta = new Range(0, toItem.size + toMaxAdditional)
    if (toSizeDelta.high < fromSizeDelta.low) {
      // No swap possible for toItem.
      continue
    }
    try {
      const fromIndexes = selectRangeCovering(
          binPair.from.items,
          new Range(
              Math.max(fromSizeDelta.low, toSizeDelta.low),
              Math.min(fromSizeDelta.high, toSizeDelta.high),
              false),
          new Range(2, netItemsToMove + 1, false))
      const fromItems = fromIndexes.map(index => binPair.from.items[index])
      const netSize = Item.sizeOf(fromItems) - toItem.size
      if (netSize > bestSwap[0]) {
        bestSwap = [netSize, new SwapPair(fromItems, [toItem])]
      }
    } catch (error) {
      if (!(error instanceof NoSolutionError)) {
        throw error
      }
    }
  }
  return bestSwap[1]
}
