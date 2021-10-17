import { Bin }  from '../repack/bin'
import { Item }  from '../repack/item'
import { duplicates, missing } from '../util/utils'

export interface ErrorHandler {
  handle: (message: string) => void
}

export class ThrowingErrorHandler implements ErrorHandler {
  handle(message: string): never {
    throw new Error(message)
  }
}

/**
 * Checks whether all items can fit in the bins.
 * Does not modify its arguments.
 */
export function packFeasibility(
    bins: readonly Bin[], newItems: readonly Item[], errorHandler: ErrorHandler): void {
  const binSpace = Bin.capacityOf(bins)
  const itemSpace =
      Item.sizeOf(newItems) +
      bins.reduce((acc: number, bin: Bin) => acc + bin.fill, 0)
  const totalItems =
      newItems.length +
      bins.reduce((acc: number, bin: Bin) => acc + bin.itemCount, 0)
  const totalSlots = Bin.totalSlots(bins)

  if (binSpace < itemSpace) {
    errorHandler.handle(`No packing possible: There is only ${binSpace} total space but `+
        `${itemSpace} of total item size to be placed`)
  }
  if (totalSlots < totalItems) {
    errorHandler.handle(`No packing possible: There are only ${totalSlots} total slots but `+
        `${totalItems} items to be placed`)
  }
}

/**
 * Checks whether any items are missing/added.
 * Checks whether any item still has an undefined newBinId.
 * Checks whether any item appears more than once.
 * Checks whether any bins have been added or removed.
 *
 * @param beforeBins          Bins prior to packing
 * @param newItems            Items not in one of the beforeBins
 * @param afterBins           Bins after packing
 * @param nonFittingItems     Known items not added to a bin
 * @param errorHandler        ErrorHandler
 */
export function itemAccounting(
    beforeBins: readonly Bin[],
    newItems: readonly Item[],
    afterBins: readonly Bin[],
    nonFittingItems: readonly Item[],
    errorHandler: ErrorHandler): void {
  if (beforeBins.length !== afterBins.length) {
    errorHandler.handle(`Started with ${beforeBins.length} bins, ended up with `+
        `${afterBins.length} bins`)
  }
  const beforeBinIds = new Set(beforeBins.map(bin => bin.id))
  if (beforeBinIds.size !== beforeBins.length) {
    errorHandler.handle('Non-unique IDs present in original bins')
  }
  const beforeItemIds = new Set(beforeBins.flatMap(bin => bin.items.map(item => item.id)))
  newItems.forEach(item => beforeItemIds.add(item.id))
  for (const bin of afterBins) {
    if (!beforeBinIds.has(bin.id)) {
      errorHandler.handle(`Bin with ID ${bin.id} was not present in the original data`)
    }
    for (const item of bin.items) {
      if (!beforeItemIds.has(item.id)) {
        errorHandler.handle(`Item with ID ${item.id} was not present in the original data`)
      }
      if (item.currentBinId === undefined) {
        errorHandler.handle(`Item with ID ${item.id} and original bin ID ${item.originalBinId} `+
            'has not been assigned a new bin ID')
      }
    }
  }
  // Check for duplicates in the input items.
  const beforeItems = beforeBins.flatMap(bin => bin.items).concat(newItems)
  const beforeItemDuplicates = duplicates(beforeItems, item => item.id)
  if (0 < beforeItemDuplicates.length) {
    errorHandler.handle(`There are ${beforeItemDuplicates.length} duplicates in the input items: `+
        beforeItemDuplicates.join(', '))
  }
  // Check for duplicates in the output items.
  const afterItems = afterBins.flatMap(bin => bin.items).concat(nonFittingItems)
  const afterItemDuplicates = duplicates(afterItems, item => item.id)
  if (0 < afterItemDuplicates.length) {
    errorHandler.handle(`There are ${afterItemDuplicates.length} duplicates in the output items: `+
        afterItemDuplicates.join(', '))
  }
  if (beforeItems.length !== afterItems.length) {
    if (beforeItems.length < afterItems.length) {
      errorHandler.handle(`There were ${beforeItems.length} input items but ${afterItems.length} `+
          `output items. Items missing in input: `+
          missing(afterItems, beforeItems, item => item.id).map(item => item.id).join(', '))
    } else {
      errorHandler.handle(`There were ${beforeItems.length} input items but ${afterItems.length} `+
          `output items. Items missing in output: `+
          missing(beforeItems, afterItems, item => item.id).map(item => item.id).join(', '))
    }
  }
}

/**
 * Checks whether any bin invariants are violated.
 */
export function validateBins(bins: readonly Bin[], errorHandler: ErrorHandler): void {
  for (const bin of bins) {
    if (bin.itemCount > bin.maxItems) {
      if (bin.displayMaxItems !== bin.maxItems) {
        errorHandler.handle(`Bin ${bin.id} with max items ${bin.displayMaxItems} and `+
            `target max items ${bin.maxItems} contains `+
            `${bin.itemCount} items.`)
      } else {
        errorHandler.handle(`Bin ${bin.id} with max items ${bin.maxItems} contains `+
            `${bin.itemCount} items.`)
      }
    }
    if (bin.fill > bin.capacity) {
      errorHandler.handle(`Bin ${bin.id} with capacity ${bin.capacity} is filled to ${bin.fill}.`)
    }
  }
  const duplicateBins = duplicates(bins, bin => bin.id)
  if (0 < duplicateBins.length) {
    errorHandler.handle(`Duplicate bins: There are ${duplicateBins.length} duplicate bins: `+
        duplicateBins.map(bin => bin.id).join(', '))
  }
}
