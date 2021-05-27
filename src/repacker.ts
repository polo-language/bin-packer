import { Bin }  from './repack/bin'
import { Item }  from './repack/item'
import { fill } from './repack/fill'
import { shiftOverfull, shiftSlots, unshiftMoves } from './repack/shift'
import { swapSpace, unswapMoves } from './repack/swap'

/**
 * Moves items between bins to reduce overage of slot and/or space usage.
 * Modifies bins in-place.
 */
export function repack(bins: Bin[]) {
  if (bins.some(bin => bin.isOverfull())) {
    shiftOverfull(bins)
  }
  if (bins.some(bin => bin.isOverfull())) {
    swapSpace(bins)
  }
}

/**
 * Adds as many new items as possible without increasing overage of slot and/or space usage.
 * Modifies bins and newItems in-place.
 */
export function packNew(bins: Bin[], newItems: Item[]): Item[] {
  let nonFittingItems: Item[]
  if (newItems.length > 0) {
    nonFittingItems = fill(bins, newItems)
  } else {
    nonFittingItems = []
  }
  if (0 < nonFittingItems.length) {
    shiftSlots(bins)
    nonFittingItems = fill(bins, nonFittingItems)
  }
  unshiftMoves(bins)
  unswapMoves(bins)
  return nonFittingItems
}
