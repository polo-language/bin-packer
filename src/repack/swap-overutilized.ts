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
export function swapSpace(bins: Bin[]) {
  // Algorithm:
  // While there are still oversized bins:
  //    Select the most overutilized bin and the bin with most free space.
  //    For each item x in the free space bin, smallest to largest, 
  //       Find the set of items in the over bin that is < x + freeSpace.
  //       If there is an item in this set >= x + overutilization, swap it.
  //       Else, take the largest item in the set and store as a pair [x, candidate_x].
  //    Swap the pair that maximizes candidate_x - x.
  const [negSpaceBins, noSpaceBins, posSpaceBins] =  bins.reduce(
      (acc: [Bin[], Bin[], Bin[]], bin: Bin) => {
        acc[1 + Math.sign(bin.freeSpace)].push(bin)
        return acc
      },
      [[], [], []]
  )
  negSpaceBins.sort((a, b) => b.utilization - a.utilization)  // Most overage to least.
  posSpaceBins.sort((a, b) => a.utilization - b.utilization)  // Most free space to Least.
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
    const fromIndexCandidates: Entry<Item>[] = []
    const maxSize = toItem.size + toBin.freeSpace
    const minTarget = toItem.size + fromBin.overutilization
    const fromItems = fromBin.items
    for (let fromIndex = fromItems.length - 1; 0 <= fromIndex; --fromIndex) { // Largest to smallest
      const fromItem = fromItems[fromIndex]
      if (fromItem.size <= toItem.size) {
        // The from items will only get smaller from here, so don't loop through the rest.
        break // for
      }
      if (fromItem.size < maxSize) {
        if (minTarget <= fromItem.size) {
          return new SwapPair(new Entry(fromIndex, fromItem), new Entry(toIndex, toItem))
        } else {
          fromIndexCandidates.push(new Entry(fromIndex, fromItem))
        }
      }
    }
    if (0 !== fromIndexCandidates.length) {
          candidatePairs.push(new SwapPair(
          max(fromIndexCandidates, entry => entry.value.size), new Entry(toIndex, toItem)))
    }
  }
  return 0 === candidatePairs.length ?
      null :
      max(candidatePairs, pair => pair.from.value.size - pair.to.value.size)
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
      binaryApply(posSpaceBins, bin, isLessUtilized, spliceBin)
    }
  } else {
    binaryApply(negSpaceBins, 0, isMoreUtilizedByIndex, moveBinWithin)
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
    binaryApply(posSpaceBins, entry.index, isMoreUtilizedByIndex, moveBinWithin)
  }
}

function isLessUtilized(bin: Bin, _: Bin[], otherBin: Bin): boolean {
  return bin.utilization <= otherBin.utilization
}

function spliceBin(bin: Bin, bins: Bin[], targetIndex: number) {
  bins.splice(targetIndex, 0, bin)
}

function isMoreUtilizedByIndex(currentIndex: number, bins: Bin[], otherBin: Bin): boolean {
  return bins[currentIndex].utilization >= otherBin.utilization
}

function moveBinWithin(currentIndex: number, bins: Bin[], targetIndex: number) {
  if (targetIndex === currentIndex || targetIndex + 1 === currentIndex) {
    return
  }
  // Note that in both cases, target index means the index of the frist item greater than the moving
  // item. In the first case, the moving item ends up at the target index, in the second case it is
  // placed one position before the target index.
  const binToMove = bins[currentIndex]
  if (targetIndex < currentIndex) {
    bins.copyWithin(targetIndex + 1, targetIndex, currentIndex)
    bins[targetIndex] = binToMove
  } else {
    bins.copyWithin(currentIndex, currentIndex + 1, targetIndex)
    bins[targetIndex - 1] = binToMove
  }
}
