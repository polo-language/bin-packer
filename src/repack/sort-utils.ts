import { Bin }  from '../repack/bin'

export function hasMoreFreeSpace(bin: Bin, _: Bin[], otherBin: Bin): boolean {
  return otherBin.freeSpace <= bin.freeSpace
}
export function hasLessFreeSpace(bin: Bin, _: Bin[], otherBin: Bin): boolean {
  return bin.freeSpace <= otherBin.freeSpace
}

export function hasLessFreeSpaceByIndex(currentIndex: number, bins: Bin[], otherBin: Bin): boolean {
  return bins[currentIndex].freeSpace <= otherBin.freeSpace
}

export function hasMoreFreeSpaceByIndex(currentIndex: number, bins: Bin[], otherBin: Bin): boolean {
  return otherBin.freeSpace <= bins[currentIndex].freeSpace
}

export function hasMoreOverfillByIndex(currentIndex: number, bins: Bin[], otherBin: Bin): boolean {
  return otherBin.overfill <= bins[currentIndex].overfill
}

export function hasMoreFreeSlots(bin: Bin, _: Bin[], otherBin: Bin): boolean {
  return otherBin.freeSlots <= bin.freeSlots
}

export function spliceOne<T>(bin: T, bins: T[], targetIndex: number): void {
  bins.splice(targetIndex, 0, bin)
}

/**
 * Moves the obj at currentIndex directly behind the obj at targetIndex. When targetIndex is less
 * than or equal to currentIndex, the moving obj ends up at targetIndex, otherwise it is moved to
 * one position before targetIndex (since intervening objs are shifted back by one to fill in the
 * space of the moving obj).
 */
export function moveWithin<T>(currentIndex: number, t: T[], targetIndex: number): void {
  if (targetIndex === currentIndex || targetIndex + 1 === currentIndex) {
    return
  }
  const binToMove = t[currentIndex]
  if (targetIndex < currentIndex) {
    t.copyWithin(targetIndex + 1, targetIndex, currentIndex)
    t[targetIndex] = binToMove
  } else {
    t.copyWithin(currentIndex, currentIndex + 1, targetIndex)
    t[targetIndex - 1] = binToMove
  }
}
