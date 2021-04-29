import { Item, Bin }  from './common'
import * as validation from './util/validation'
import { greedyFillMaxSkipNonFitting } from './repack/greedy-fill-max'
import { shiftOverfull } from './repack/shift-overutilized'
import { swapSpace } from './repack/swap-overutilized'

export function repack(bins: readonly Bin[], newItems: readonly Item[]): [Bin[], Item[]] {
  // validation.checkFeasibility(bins, newItems)
  const workingBins: Bin[] = bins.map(bin => bin.deepClone())
  const workingNewItems: Item[] = newItems.map(item => item.deepClone())
  const nonFittingItems = repackCopies(workingBins, workingNewItems)
  validation.itemAccounting(bins, newItems, workingBins, nonFittingItems)
  // validation.validateBins(workingBins)
  return [workingBins, nonFittingItems]
}

/** Modifies bins in-place. */
function repackCopies(bins: Bin[], newItems: Item[]): Item[] {
  let nonFittingItems: Item[]
  if (newItems.length > 0) {
    nonFittingItems = greedyFillMaxSkipNonFitting(bins, newItems)
  } else {
    nonFittingItems = []
  }
  if (bins.some(bin => bin.isOverfull())) {
    shiftOverfull(bins)
  }
  if (bins.some(bin => bin.isOverfull())) {
    swapSpace(bins)
  }
  return nonFittingItems
}

// function anyNegativeSlots(bins: Bin[]): boolean {
//   return bins.some(bin => bin.maxItems - bin.itemCount < 0)
// }
