import { Item, Bin, ChangeReport }  from './common'
import * as validation from './validation'
import { greedyFillMax } from './greedy-fill-max'

export function repack(bins: Bin[], newItems: Item[]): [Bin[], ChangeReport] {
  checkFeasibility(bins, newItems)
  const workingBins: Bin[] = bins.map(bin => Bin.deepClone(bin))
  const workingNewItems: Item[] = newItems.map(item => Item.deepClone(item))
  let [openBins, overutilizedBins] = splitByUtilization(workingBins)

  // Run the algorithm
  if (overutilizedBins.length > 0) {
    // Temporary
    let errMsg = 'Moving items fom overfull bins is not yet supported.\n'
    for (const bin of overutilizedBins) {
      errMsg += `Bin ${bin.id} with ${bin.maxItems} max items and ${bin.capacity} capacity has `
      errMsg += `${bin.itemCount} items and ${bin.utilization} utilization.\n`
    }
    throw new Error(errMsg)
  }
  // No bins should now be overutilized, so pass them all to be filled with new items.
  greedyFillMax(workingBins, workingNewItems)

  validation.itemAccounting(bins, newItems, workingBins)
  validation.validateBins(workingBins)
  return [workingBins, validation.getChangeReport(workingBins)]
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

/**
 * Throws if not all items can fit in the bins.
 * Does not modify its arguments.
 */
function checkFeasibility(bins: readonly Bin[], newItems: readonly Item[]) {
  const binSpace = bins.reduce((acc: number, bin: Bin) => acc + bin.capacity, 0)
  const itemSpace =
      newItems.reduce((acc: number, item: Item) => acc + item.size, 0) +
      bins.reduce((acc: number, bin: Bin) => acc + bin.utilization, 0)
  const totalItems =
      newItems.length +
      bins.reduce((acc: number, bin: Bin) => acc + bin.itemCount, 0)
  const totalSlots = bins.reduce((acc: number, bin: Bin) => acc + bin.maxItems, 0)

  if (binSpace < itemSpace) {
    throw new Error(`There is only ${binSpace} total space but at least ` +
        `${itemSpace} of total item size to be placed`)
  }
  if (totalSlots < totalItems) {
    throw new Error(`There are only ${totalSlots} total slots but ` +
        `${totalItems} items to be placed`)
  }
}
