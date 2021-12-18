import { MoveCallback } from '../index'
import { Bin } from '../repack/bin'
import { Item } from '../repack/item'
import { binaryApply } from '../util/binary-apply'
import { SwapPair } from '../util/utils'
import * as SortUtils from './sort-utils'

class Entry<T> {
  constructor(readonly index: number, readonly value: T) { }
}

/**
 * Swaps items from bins with space overutilization to bins with space underutilization.
 * Disregards slot over-/underutilization.
 */
export function swapSpace(bins: readonly Bin[], moveCallback?: MoveCallback): void {
  // Algorithm:
  // While there are still oversized bins:
  //    Select the most overutilized bin and the bin with most free space.
  //    For each item x in the free space bin, smallest to largest, 
  //       Find the set of items in the over bin that is < x + freeSpace.
  //       If there is an item in this set >= x + overfill, swap it.
  //       Else, take the largest item in the set and store as a pair [x, candidate_x].
  //    Swap the pair that maximizes candidate_x - x.
  const [negSpaceBins, noSpaceBins, posSpaceBins] =  bins.reduce(
      (acc: [Bin[], Bin[], Bin[]], bin: Bin) => {
        acc[1 + Math.sign(bin.freeSpace)].push(bin)
        return acc
      },
      [[], [], []]
  )
  negSpaceBins.sort((a, b) => a.freeSpace - b.freeSpace)  // Most overage to least.
  posSpaceBins.sort((a, b) => b.freeSpace - a.freeSpace)  // Most free space to Least.
  let fromIndex = 0
  while (negSpaceBins.length > fromIndex) {
    let foundSwap = false
    const fromBin = negSpaceBins[fromIndex]
    for (let toIndex = 0; toIndex < posSpaceBins.length; ++toIndex) {
      const toBin = posSpaceBins[toIndex]
      const pair = findSwapPair(fromBin, toBin)
      if (pair !== null) {
        Bin.swap(
            new SwapPair(fromBin, toBin),
            pair.map(entry => entry.index),
            'swapSpace',
            moveCallback)
        resortNegSpaceBin(negSpaceBins, noSpaceBins, posSpaceBins, new Entry(fromIndex, fromBin))
        resortPosSpaceBin(noSpaceBins, posSpaceBins, new Entry(toIndex, toBin))
        foundSwap = true
        break   // for loop
      }
    }
    if (!foundSwap) {
      // Unable to find a swapping partner for fromBin. Since it will always be the most
      // overutilized bin (other than ones already skipped), it will remain at this index in
      // negSpaceBins, so won't be retrying it later.
      ++fromIndex
    }
  }
}

function findSwapPair(fromBin: Bin, toBin: Bin): SwapPair<Entry<Item>> | null {
  const candidatePairs: SwapPair<Entry<Item>>[] = []
  const toItems = toBin.items
  for (let toIndex = 0; toIndex < toItems.length; ++toIndex) { // Smallest to largest
    const toItem = toItems[toIndex]
    const fromCandidate = findMaxPartner(fromBin, toItem.size, toItem.size + toBin.freeSpace)
    if (fromCandidate !== null) {
      if (toItem.size + fromBin.overfill <= fromCandidate.value.size) {
        return new SwapPair(fromCandidate, new Entry(toIndex, toItem))
      } else {
        candidatePairs.push(new SwapPair(fromCandidate, new Entry(toIndex, toItem)))
      }
    }
  }
  return 0 === candidatePairs.length ?
      null :
      max(candidatePairs, pair => pair.from.value.size - pair.to.value.size)
}

function findMaxPartner(bin: Bin, minSize: number, maxSize: number): Entry<Item> | null {
  const items = bin.items
  for (let fromIndex = items.length - 1; 0 <= fromIndex; --fromIndex) { // Largest to smallest
    const item = items[fromIndex]
    if (item.size <= minSize) {
      // Items will only get smaller from here, so don't loop through the rest.
      return null
    }
    // The first item that satisfies the criterion is always the best one since it is the largest.
    if (item.size <= maxSize) {
      return new Entry(fromIndex, item)
    }
  }
  return null
}

function max<T>(array: T[], sizeOf: (t: T) => number): T {
  return array.reduce((a, b) => sizeOf(a) >= sizeOf(b) ? a : b)
}

function resortNegSpaceBin(
    negSpaceBins: Bin[],
    noSpaceBins: Bin[],
    posSpaceBins: Bin[],
    entry: Entry<Bin>) {
  if (entry.value.freeSpace >= 0) {
    const bin = negSpaceBins.splice(entry.index, 1)[0]
    if (entry.value !== bin) {
      throw new Error(`Algorithm error: Bin not found at indicated index.`)
    }
    if (bin.freeSpace === 0) {
      noSpaceBins.push(bin) // Order doesn't matter.
    } else {
      binaryApply(posSpaceBins, bin, SortUtils.hasMoreFreeSpace, SortUtils.spliceOne)
    }
  } else {
    binaryApply(
        negSpaceBins, entry.index, SortUtils.hasLessFreeSpaceByIndex, SortUtils.moveWithin)
  }
}

function resortPosSpaceBin(
    noSpaceBins: Bin[],
    posSpaceBins: Bin[],
    entry: Entry<Bin>) {
  if (entry.value.freeSpace < 0) {
    throw new Error(`Algorithm error: Should never over-fill a previously open bin.`)
  }
  if (entry.value.freeSpace === 0) {
    const bin = posSpaceBins.splice(entry.index, 1)[0]
    if (entry.value !== bin) {
      throw new Error(`Algorithm error: Bin not found at indicated index.`)
    }
    noSpaceBins.push(bin)
  } else {
    binaryApply(
        posSpaceBins, entry.index, SortUtils.hasMoreFreeSpaceByIndex, SortUtils.moveWithin)
  }
}

/**
 * Looks for pairs of items in different bins that were originally in the current bin of the other
 * item, then swaps each back to its original bin if space restrictions allow.
 */
export function unswapMoves(bins: readonly Bin[], moveCallback?: MoveCallback): void {
  const binMap = new Map<string, Bin>(bins.map(bin => [bin.id, bin]))
  for (const bin of Array.from(binMap.values())) {
    // Keep trying with the same bin so long as a swap is made. Cannot just loop through the items
    // since swapping reorders them.
    while (findOneForSwap(bin, binMap, moveCallback)) { /* do nothing */ }
  }
}


/** Tries to find and execute a swap for each moved item. */
function findOneForSwap(bin: Bin, binMap: Map<string, Bin>, moveCallback?: MoveCallback): boolean {
  const items = bin.items
  for (let i = 0; i < items.length; ++i) {
    const item = items[i]
    if (item.originalBinId !== undefined && item.hasMoved()) {
      // Since item has moved, we can be sure bin and originalBin aren't the same.
      // Hence an item of originalBin with an original id equal to bin's id has moved.
      const originalBin = binMap.get(item.originalBinId)
      if (originalBin !== undefined) {
        if (findSwapPartner(bin, originalBin, new Entry<Item>(i, item), moveCallback)) {
          return true
        }
      }
    }
  }
  return false
}

/**
 * Tries to find an item in binB that was originally in binA, and swaps it with the item in
 * entry if doing so won't violate space restrictions.
 * Entry must contain an item in binA that was originaly in binB.
 */
function findSwapPartner(binA: Bin, binB: Bin, entry: Entry<Item>, moveCallback?: MoveCallback)
    : boolean {
  const binBItems = binB.items
  for (let i = 0; i < binBItems.length; ++i) {
    const oBinItem = binBItems[i]
    if (oBinItem.originalBinId === binA.id) {
      if (oBinItem.size <= binA.freeSpace + entry.value.size &&
          entry.value.size <= binB.freeSpace + oBinItem.size) {
        Bin.swap(
            new SwapPair(binA, binB),
            new SwapPair(entry.index, i),
            'unswapMoves',
            moveCallback)
        return true
      }
    }
  }
  return false
}
