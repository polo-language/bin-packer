import { MoveCallback } from '../index'
import { Bin }  from '../repack/bin'
import { Item }  from '../repack/item'
import { sortAscending } from '../util/utils'
import { selectCovering } from './covering'

/** Picks out the smallest collection of items that meet the minimums, then removes them. */
export function remove(
    bins: readonly Bin[],
    candidateItems: Item[],
    minSizeToRemove: number,
    minCountToRemove: number,
    moveCallback?: MoveCallback): Item[] {
  return removeAll(
      bins,
      selectCovering(
          sortAscending(candidateItems, item => item.size),
          minSizeToRemove,
          minCountToRemove)
              .map(index => candidateItems[index]),
      moveCallback)
}

/**
 * Removes all provided items from bins.
 * Returns items for convenience.
 */
export function removeAll(bins: readonly Bin[], items: Item[], moveCallback?: MoveCallback): Item[] {
  const binMap = new Map<string, Bin>(bins.map(bin => [bin.id, bin]))
  for (const item of items) {
    const binId = item.currentBinId
    if (binId === undefined) {
      throw new Error(`Item with ID ${item.id} does not belong to a bin and hence can not be `
          +`removed`)
    }
    const bin = binMap.get(binId)
    if (bin === undefined) {
      throw new Error(`Item with ID ${item.id} belongs to bin ${binId}, which was not provided`)
    }
    const index = bin.items.findIndex(binItem => binItem.id === item.id)
    if (index === -1) {
      throw new Error(`Item with ID ${item.id} claims to belongs to bin ${binId}, but is not `+
          `present`)
    }
    bin.moveOut(index, null, 'remove', true, moveCallback)
  }
  return items
}
