import { Item, Bin, RepackAlgorithm, ChangeReport }  from './common'
import * as validation from './validation'
import { greedyFillMax } from './greedy-fill-max'

export function repack(bins: Bin[], newItems: Item[]): [Bin[], ChangeReport] {
  checkFeasibility(bins, newItems)
  const originalBins: readonly Bin[] = Object.freeze(bins.map(bin => Bin.deepClone(bin)))
  const originalNewItems: readonly Item[] =
      Object.freeze(newItems.map(item => Item.deepClone(item)))
  const [openBins, overfullBins] = bins.reduce(
    (acc: [Bin[], Bin[]], bin: Bin) => {
      acc[bin.isOpen() ? 0 : 1].push(bin)
      return acc
    }
    , [[], []]
  )

  // Temporary
  if (overfullBins.length > 0) {
    let errMsg = 'Moving items fom overfull bins is not yet supported.\n'
    for (const bin of overfullBins) {
      errMsg += `Bin ${bin.id} with ${bin.maxItems} max items and ${bin.capacity} capacity has `
      errMsg += `${bin.itemCount} items and ${bin.utilization} utilization.\n`
    }
    throw new Error(errMsg)
  }

  // Run the algorithm
  // TODO: Switch/iterate algorithms based on metrics and/or initial success.
  const repackAlgorithm: RepackAlgorithm = greedyFillMax
  // const repackAlgorithm: RepackAlgorithm = doNothing

  const repackedBins = repackAlgorithm(openBins, overfullBins, newItems)
  validation.itemAccounting(originalBins, originalNewItems, repackedBins)
  validation.validateBins(repackedBins)
  return [repackedBins, validation.getChangeReport(repackedBins)]
}

// Output will not pass validation!
function doNothing(openBins: Bin[], overfullBins: Bin[], newItems: Item[]): Bin[] {
  return openBins.concat(overfullBins)
}

/**
 * Throws if not all items can fit in the bins.
 * Does not modify its arguments.
 */
function checkFeasibility(bins: Bin[], newItems: Item[]) {
  const binSpace = bins.reduce((acc: number, bin: Bin) => acc + bin.capacity, 0)
  const itemSpace =
      newItems.reduce((acc: number, item: Item) => acc + item.size, 0) +
      bins.reduce((acc: number, bin: Bin) => acc + bin.utilization, 0)
  const totalItems =
      newItems.length +
      bins.reduce((acc: number, bin: Bin) => acc + bin.itemCount, 0)
  const totalSlots = bins.reduce((acc: number, bin: Bin) => acc + bin.maxItems, 0)

  if (binSpace < itemSpace) {
    throw new Error(`There is only ${binSpace} total space but at least` +
        `${itemSpace} total item size to be placed`)
  }
  if (totalSlots < totalItems) {
    throw new Error(`There are only ${totalSlots} total slots but ` +
        `${totalItems} items to be placed`)
  }
}
