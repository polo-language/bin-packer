import { Item, Bin } from '../common'
import { binaryApply } from '../util/utils'

class SwapPair<T> {
  constructor(readonly from: T, readonly to: T) { }

  map<U>(f: (t: T) => U): SwapPair<U> {
    return new SwapPair(f(this.from), f(this.to))
  }
}

class Entry {
  constructor(readonly index: number, readonly item: Item) { }
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
  while (negSpaceBins.length > 0) {
    const fromBin = negSpaceBins[0]
    const toBin = posSpaceBins[0]
    const candidatePairs: SwapPair<Entry>[] = []
    const toItems = toBin.items
    for (let toIndex = 0; toIndex < toItems.length; ++toIndex) { // Smallest to largest
      const toItem = toItems[toIndex]
      const fromIndexCandidates: Entry[] = []
      const maxSize = toItem.size + toBin.freeSpace
      const minTarget = toItem.size + fromBin.overutilization
      let idealFromIndex: number | undefined = undefined
      const fromItems = fromBin.items
      for (let fromIndex = 0; fromIndex < fromItems.length; ++fromIndex) {
        const fromItem = fromItems[fromIndex]
        if (fromItem.size < maxSize) {
          if (minTarget <= fromItem.size) {
            idealFromIndex = fromIndex
            break // fromItems loop
          } else {
            fromIndexCandidates.push(new Entry(fromIndex, fromItem))
          }
        }
      }
      if (idealFromIndex !== undefined) {
        swap(new SwapPair(fromBin, toBin), new SwapPair(idealFromIndex, toIndex))
        break // toItems loop
      } else {
        candidatePairs.push(new SwapPair(
            max(fromIndexCandidates, entry => entry.item.size), new Entry(toIndex, toItem)))
      }
    }
    swap(
        new SwapPair(fromBin, toBin),
        max(candidatePairs, pair => pair.from.item.size - pair.to.item.size)
            .map(entry => entry.index))
    // Move swapping bins based on their new utilizations.
    if (fromBin.freeSpace <= 0) {
      const fromBin = negSpaceBins.splice(0, 1)[0] // Shadowing
      if (fromBin.freeSpace === 0) {
        noSpaceBins.push(fromBin) // Order doesn't matter.
      } else {
        binaryApply(posSpaceBins, fromBin, isLessUtilized, spliceBin)
      }
    } else {
      binaryApply(negSpaceBins, 0, isMoreUtilizedByIndex, moveBinWithin)
    }
    if (toBin.freeSpace < 0) {
      throw new Error(`Algorithm error: Should never over fill a bin.`)
    }
    if (toBin.freeSpace == 0) {
      noSpaceBins.push(toBin)
    }
  }
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
