import { Item, Bin } from '../common'
import { binaryApply } from '../util/utils'

class SwapPair<T> {
  constructor(readonly from: T, readonly to: T) { }

  map<U>(f: (t: T) => U): SwapPair<U> {
    return new SwapPair(f(this.from), f(this.to))
  }
}

class Entry<T> {
  constructor(readonly index: number, readonly value: T) { }
}

/**
 * Swaps items from bins with space overutilization to bins with space underutilization.
 * Disregards slot over-/underutilization.
 */
export function swapSpace(bins: readonly Bin[]) {
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
        swap(new SwapPair(fromBin, toBin), pair.map(entry => entry.index))
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

function swap(binPair: SwapPair<Bin>, itemIndexPair: SwapPair<number>) {
  const fromItem = binPair.from.remove(itemIndexPair.from)
  const toItem = binPair.to.remove(itemIndexPair.to)
  binPair.from.add(toItem)
  binPair.to.add(fromItem)
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
      binaryApply(posSpaceBins, bin, isLessFilled, spliceBin)
    }
  } else {
    binaryApply(negSpaceBins, 0, isMoreFilledByIndex, moveBinWithin)
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
    binaryApply(posSpaceBins, entry.index, isMoreFilledByIndex, moveBinWithin)
  }
}

function isLessFilled(bin: Bin, _: Bin[], otherBin: Bin): boolean {
  return bin.fill <= otherBin.fill
}

function spliceBin(bin: Bin, bins: Bin[], targetIndex: number) {
  bins.splice(targetIndex, 0, bin)
}

function isMoreFilledByIndex(currentIndex: number, bins: Bin[], otherBin: Bin): boolean {
  return bins[currentIndex].fill >= otherBin.fill
}

/**
 * Moves the bin at currentIndex. targetIndex is the index of the smallest bin greater in sort order
 * than the moving bin. When targetIndex <= currentIndex, the moving item ends up at targetIndex,
 * otherwise it is moved to one position before targetIndex (since intervening bins are shifted back
 * by one to fill in the space of the moving bin).
 */
function moveBinWithin(currentIndex: number, bins: Bin[], targetIndex: number) {
  if (targetIndex === currentIndex || targetIndex + 1 === currentIndex) {
    return
  }
  const binToMove = bins[currentIndex]
  if (targetIndex < currentIndex) {
    bins.copyWithin(targetIndex + 1, targetIndex, currentIndex)
    bins[targetIndex] = binToMove
  } else {
    bins.copyWithin(currentIndex, currentIndex + 1, targetIndex)
    bins[targetIndex - 1] = binToMove
  }
}
