import { MoveCallback } from './index'
import { Bin }  from './repack/bin'
import { Item }  from './repack/item'
import { fill } from './repack/fill'
import { shiftOverfull, shiftSlots, unshiftMoves } from './repack/shift'
import { swapSpace, unswapMoves } from './repack/swap'

/**
 * Moves items between bins to reduce overage of slot and/or space usage.
 * Modifies bins in-place.
 */
export function repack(bins: Bin[], moveCallback: MoveCallback) {
  if (bins.some(bin => bin.isOverfull())) {
    shiftOverfull(bins, moveCallback)
  }
  if (bins.some(bin => bin.isOverfull())) {
    swapSpace(bins, moveCallback)
  }
}

/**
 * Adds as many new items as possible without increasing overage of slot and/or space usage.
 * Modifies bins and newItems in-place.
 */
export function packNew(bins: Bin[], newItems: Item[], moveCallback: MoveCallback): Item[] {
  let nonFittingItems: Item[]
  if (newItems.length > 0) {
    nonFittingItems = fill(bins, newItems, moveCallback)
  } else {
    nonFittingItems = []
  }
  if (0 < nonFittingItems.length) {
    shiftSlots(bins, moveCallback)
    nonFittingItems = fill(bins, nonFittingItems, moveCallback)
  }
  unshiftMoves(bins, moveCallback)
  unswapMoves(bins, moveCallback)
  return nonFittingItems
}
