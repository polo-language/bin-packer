import { Item, Bin, Analysis }  from './common'
import * as validation from './util/validation'
import { greedyFillMax } from './repack/greedy-fill-max'
import { shiftOverutilized } from './repack/shift-overutilized'
import { swapSpace } from './repack/swap-overutilized'

export function repack(bins: Bin[], newItems: Item[]): Bin[] {
  validation.checkFeasibility(bins, newItems)
  const workingBins: Bin[] = bins.map(bin => bin.deepClone())
  const workingNewItems: Item[] = newItems.map(item => item.deepClone())
  repackCopies(workingBins, workingNewItems)
  validation.itemAccounting(bins, newItems, workingBins)
  // validation.validateBins(workingBins)
  return workingBins
}

/** Modifies bins in-place. */
function repackCopies(bins: Bin[], newItems: Item[]) {
  if (newItems.length > 0) {
    greedyFillMax(bins, newItems)
  }
  if (bins.some(bin => bin.isOverutilized())) {
    shiftOverutilized(bins)
  }
  if (bins.some(bin => bin.isOverutilized())) {
    swapSpace(bins)
  }
}
