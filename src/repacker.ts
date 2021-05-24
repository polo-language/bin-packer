import { Bin }  from './repack/bin'
import { Item }  from './repack/item'
import { itemAccounting, ThrowingErrorHandler } from './repack/validation'
import { fill } from './repack/fill'
import { shiftOverfull, shiftSlots, unshiftMoves } from './repack/shift'
import { swapSpace, unswapMoves } from './repack/swap'

export function repack(bins: readonly Bin[], newItems: readonly Item[]): [Bin[], Item[]] {
  // validation.checkFeasibility(bins, newItems)
  const workingBins: Bin[] = bins.map(bin => bin.deepClone())
  const workingNewItems: Item[] = newItems.map(item => item.deepClone())
  const nonFittingItems = repackCopies(workingBins, workingNewItems)
  itemAccounting(bins, newItems, workingBins, nonFittingItems, new ThrowingErrorHandler())
  // validation.validateBins(workingBins)
  return [workingBins, nonFittingItems]
}

/** Modifies bins in-place. */
function repackCopies(bins: Bin[], newItems: Item[]): Item[] {
  let nonFittingItems: Item[]
  if (newItems.length > 0) {
    nonFittingItems = fill(bins, newItems)
  } else {
    nonFittingItems = []
  }
  if (bins.some(bin => bin.isOverfull())) {
    shiftOverfull(bins)
  }
  if (bins.some(bin => bin.isOverfull())) {
    swapSpace(bins)
  }
  if (0 < nonFittingItems.length) {
    shiftSlots(bins)
    nonFittingItems = fill(bins, nonFittingItems)
  }
  unshiftMoves(bins)
  unswapMoves(bins)
  return nonFittingItems
}
