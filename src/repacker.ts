import { MoveCallback } from './index'
import { Bin }  from './repack/bin'
import { Item }  from './repack/item'
import { fill } from './repack/fill'
import { shiftOverfull, shiftSlots, unshiftMoves } from './repack/shift'
import { swapSpace, unswapMoves } from './repack/swap'
import { slotSwap } from './repack/slot-swap'
import { shiftOverslots } from './repack/shift-slots'

/**
 * Moves items between bins to reduce overage of slot and/or space usage.
 * Modifies bins in-place.
 */
export function repack(bins: Bin[], moveCallback?: MoveCallback): void {
  if (bins.some(bin => bin.isOverfull())) {
    shiftOverfull(bins, moveCallback)
  }
  if (bins.some(bin => bin.isOverfull())) {
    swapSpace(bins, moveCallback)
  }
  if (bins.some(bin => bin.isOverslots())) {
    shiftOverslots(bins, moveCallback)
  }
}

/**
 * Adds as many new items as possible without increasing overage of slot and/or space usage.
 * Modifies bins and newItems in-place.
 */
export function packNew(bins: readonly Bin[], newItems: Item[], moveCallback?: MoveCallback)
    : Item[] {
  let nonFittingItems: Item[]
  if (0 < newItems.length) {
    nonFittingItems = fill(bins, newItems, moveCallback)
  } else {
    nonFittingItems = []
  }
  if (0 < nonFittingItems.length) {
    if (0 < shiftSlots(bins, minSize(nonFittingItems), moveCallback)) {
      nonFittingItems = fill(bins, nonFittingItems, moveCallback)
    }
  }
  if (0 < nonFittingItems.length) {
    let beforeLength: number
    do {
      beforeLength = nonFittingItems.length
      if (slotSwap(
          bins,
          Math.min.apply(null, nonFittingItems.map(item => item.size)),
          moveCallback)) {
        nonFittingItems = fill(bins, nonFittingItems, moveCallback)
      }
    } while (nonFittingItems.length < beforeLength)
  }
  return nonFittingItems
}

function minSize(items: readonly Item[]): number {
  return Math.min.apply(null, items.map(item => item.size))
}

export function unMove(bins: readonly Bin[], moveCallback?: MoveCallback): void {
  unshiftMoves(bins, moveCallback)
  unswapMoves(bins, moveCallback)
}
