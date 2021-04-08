import { Item, Bin, Move, ChangeReport }  from './common'

/**
 * Throws if any items are missing/added between the two inputs.
 * Throws if any item still has an undefined newBinId.
 * Throws if any bins have been added or removed.
 * @param beforeBins 
 * @param afterBins 
 */
export function itemAccounting(
    beforeBins: readonly Bin[],
    newItems: readonly Item[],
    afterBins: Bin[]) {
  if (beforeBins.length !== afterBins.length) {
    throw new Error(`Started with ${beforeBins.length} bins, ended up with ${afterBins.length} ` +
        'bins')
  }
  const beforeBinIds = new Set(beforeBins.map(bin => bin.id))
  if (beforeBinIds.size !== beforeBins.length) {
    throw new Error(`Non-unique IDs present in original bins`)
  }
  const beforeItemIds = new Set(beforeBins.flatMap(bin => bin.items.map(item => item.id)))
  newItems.forEach(item => beforeItemIds.add(item.id))
  let newItemCount = 0
  for (const bin of afterBins) {
    if (!beforeBinIds.has(bin.id)) {
      throw new Error(`Bin with ID ${bin.id} was not present in the original data`)
    }
    for (const item of bin.items) {
      ++newItemCount
      if (!beforeItemIds.has(item.id)) {
        throw new Error(`Item with ID ${item.id} was not present in the original data`)
      }
      if (item.newBinId === undefined) {
        throw new Error(`Item with ID ${item.id} and original bin ID ${item.originalBinId} has ` +
            'not been assigned a new bin ID')
      }
    }
  }
  if (beforeItemIds.size !== newItemCount) {
    throw new Error(`There were ${beforeItemIds.size} items before, but ${newItemCount} afterwards`)
  }
}

/**
 * Throws if any bin invariants are violated.
 * @param bins 
 */
export function validateBins(bins: Bin[]) {
  // TODO
}

/**
 * Report all item moves.
 */
export function getChangeReport(bins: Bin[]): ChangeReport {
  const moves: Move[] = []
  for (const bin of bins) {
    for (const item of bin.items) {
      if (item.originalBinId === undefined || item.originalBinId !== item.newBinId) {
        if (item.newBinId === undefined) {
          throw new Error(`Item with ID ${item.id} not assigned to a new bin`)
        }
        moves.push(new Move(item, item.originalBinId, item.newBinId))
      }
    }
  }
  return { moves: moves }
}
