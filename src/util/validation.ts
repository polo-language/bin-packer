import { Item, Bin }  from '../common'

interface ErrorHandler {
  handle: (message: string) => void
}

class ThrowingErrorHandler implements ErrorHandler {
  handle(message: string) {
    throw new Error(message)
  }
}

/**
 * Throws if not all items can fit in the bins.
 * Does not modify its arguments.
 */
 export function checkFeasibility(bins: readonly Bin[], newItems: readonly Item[]) {
  const errorHandler = new ThrowingErrorHandler()
  const binSpace = bins.reduce((acc: number, bin: Bin) => acc + bin.capacity, 0)
  const itemSpace =
      newItems.reduce((acc: number, item: Item) => acc + item.size, 0) +
      bins.reduce((acc: number, bin: Bin) => acc + bin.utilization, 0)
  const totalItems =
      newItems.length +
      bins.reduce((acc: number, bin: Bin) => acc + bin.itemCount, 0)
  const totalSlots = bins.reduce((acc: number, bin: Bin) => acc + bin.maxItems, 0)

  if (binSpace < itemSpace) {
    errorHandler.handle(`There is only ${binSpace} total space but ${itemSpace} of total item size ` +
        `to be placed`)
  }
  if (totalSlots < totalItems) {
    errorHandler.handle(`There are only ${totalSlots} total slots but ${totalItems} items to be placed`)
  }
}

/**
 * Checks whether any items are missing/added between the two inputs.
 * Checks whether any item still has an undefined newBinId.
 * Checks whether any bins have been added or removed.
 */
export function itemAccounting(
    beforeBins: readonly Bin[],
    newItems: readonly Item[],
    afterBins: Bin[]) {
  const errorHandler = new ThrowingErrorHandler()
  if (beforeBins.length !== afterBins.length) {
    errorHandler.handle(`Started with ${beforeBins.length} bins, ended up with ` +
        `${afterBins.length} bins`)
  }
  const beforeBinIds = new Set(beforeBins.map(bin => bin.id))
  if (beforeBinIds.size !== beforeBins.length) {
    errorHandler.handle('Non-unique IDs present in original bins')
  }
  const beforeItemIds = new Set(beforeBins.flatMap(bin => bin.items.map(item => item.id)))
  newItems.forEach(item => beforeItemIds.add(item.id))
  let newItemCount = 0
  for (const bin of afterBins) {
    if (!beforeBinIds.has(bin.id)) {
      errorHandler.handle(`Bin with ID ${bin.id} was not present in the original data`)
    }
    for (const item of bin.items) {
      ++newItemCount
      if (!beforeItemIds.has(item.id)) {
        errorHandler.handle(`Item with ID ${item.id} was not present in the original data`)
      }
      if (item.newBinId === undefined) {
        errorHandler.handle(`Item with ID ${item.id} and original bin ID ${item.originalBinId} ` +
            'has not been assigned a new bin ID')
      }
    }
  }
  if (beforeItemIds.size !== newItemCount) {
    errorHandler.handle(`There were ${beforeItemIds.size} items before, but ${newItemCount} ` +
        'afterwards')
  }
}

/**
 * Checks whether any bin invariants are violated.
 */
export function validateBins(bins: Bin[]) {
  const errorHandler = new ThrowingErrorHandler()
  for (const bin of bins) {
    if (bin.itemCount > bin.maxItems) {
      errorHandler.handle(`Bin ${bin.id} with max items ${bin.maxItems} contains ` +
          `${bin.itemCount} items. Full bin details: ${bin.toString()}`)
    }
    if (bin.utilization > bin.capacity) {
      errorHandler.handle(`Bin ${bin.id} with capacity ${bin.capacity} contains items with ` +
          `${bin.utilization} total utilization. Full bin details: ${bin.toString()}`)
    }
  }
}
