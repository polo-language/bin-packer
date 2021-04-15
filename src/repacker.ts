import { Item, Bin, ChangeReport }  from './common'
import * as validation from './validation'
import { greedyFillMax } from './greedy-fill-max'
import { shiftOverutilized } from './shift-overutilized'

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
  let [_, overutilizedBins] = splitByUtilization(bins)
  if (overutilizedBins.length > 0) {
    shiftOverutilized(bins)
  }
  // No bins should now be overutilized, so pass them all to be filled with new items.
  greedyFillMax(bins, newItems)
}

/**
 * Splits bins into a tuple of acceptably utilized bins and overutilized bins.
 */
function splitByUtilization(bins: Bin[]): [Bin[], Bin[]] {
  return bins.reduce(
    (acc: [Bin[], Bin[]], bin: Bin) => {
      acc[bin.isOverutilized() ? 1 : 0].push(bin)
      return acc
    },
    [[], []]
  )
}
