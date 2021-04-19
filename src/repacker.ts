import { Item, Bin, ChangeReport }  from './common'
import * as validation from './util/validation'
import { greedyFillMax } from './repack/greedy-fill-max'
import { shiftOverutilized } from './repack/shift-overutilized'

export function repack(bins: Bin[], newItems: Item[]): [Bin[], ChangeReport] {
  validation.checkFeasibility(bins, newItems)
  const workingBins: Bin[] = bins.map(bin => Bin.deepClone(bin))
  const workingNewItems: Item[] = newItems.map(item => Item.deepClone(item))
  repackCopies(workingBins, workingNewItems)
  validation.itemAccounting(bins, newItems, workingBins)
  validation.validateBins(workingBins)
  return [workingBins, validation.getChangeReport(workingBins)]
}

/** Modifies bins in-place. */
function repackCopies(bins: Bin[], newItems: Item[]) {
  if (bins.some(bin => bin.isOverutilized())) {
    shiftOverutilized(bins)
  }
  // No bins should now be overutilized, so pass them all to be filled with new items.
  greedyFillMax(bins, newItems)
}
