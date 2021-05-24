import { InputObject, PackingOutput } from '../index';
import { binaryApply } from '../util/binary-apply'
import { prepareValues } from '../util/prepare-values';
import { sortDescending } from '../util/utils';

export function nextFit<T>(
    obj: InputObject<T>,
    sizeOf: (t: T) => number,
    capacity: number)
        : PackingOutput<T> {
  const {array: array, oversized: oversized} = prepareValues(obj, sizeOf, capacity)
  const bins: T[][] = []
  let currentBinUtilization = capacity + 1 // Start out with an imaginary bin that's full.
  let blockNum = -1

  for (const value of array) {
    const size = sizeOf(value)
    currentBinUtilization += size
    if (currentBinUtilization > capacity) {
      ++blockNum
      bins[blockNum] = []
      currentBinUtilization = size
    }
    bins[blockNum].push(value)
  }
  return {bins: bins, oversized: oversized,}
}

export function firstFit<T>(
    obj: InputObject<T>,
    sizeOf: (t: T) => number,
    capacity: number)
        : PackingOutput<T> {
  return firstFitArray(obj, sizeOf, capacity, false)
}

export function firstFitDecreasing<T>(
    obj: InputObject<T>,
    sizeOf: (t: T) => number,
    capacity: number)
        : PackingOutput<T> {
  return firstFitArray(obj, sizeOf, capacity, true)
}

function firstFitArray<T>(
    obj: InputObject<T>,
    sizeOf: (t: T) => number,
    capacity: number, presort: boolean)
        : PackingOutput<T> {
  const {array: array, oversized: oversized} = prepareValues(obj, sizeOf, capacity)
  const bins: T[][] = []
  const remaining: number[] = []

  if (presort) {
    sortDescending(array, sizeOf)
  }

  for (const value of array) {
    const size = sizeOf(value)
    let createNewBin = true
    for (let i = 0; i < bins.length; ++i) {
      if (size <= remaining[i]) {
        bins[i].push(value)
        remaining[i] -= size
        createNewBin = false
        break
      }
    }
    if (createNewBin) {
      bins[bins.length] = []
      bins[bins.length - 1].push(value)
      remaining[bins.length - 1] = capacity - size
    }
  }
  return {'bins': bins, 'oversized': oversized,}
}

class SizedBin<T> {
  bin: T[]
  size: number

  constructor() {
    this.bin = []
    this.size = 0
  }
  
  static extractBins<T>(sizedBins: SizedBin<T>[]): T[][] {
    return sizedBins.map(sizedBin => sizedBin.bin)
  }
}

export function bestFitDecreasing<T>(
    obj: InputObject<T>,
    sizeOf: (t: T) => number,
    capacity: number)
        : PackingOutput<T> {
  const {array: array, oversized: oversized} = prepareValues(obj, sizeOf, capacity)
  return {
    'bins': bestFitDecreasingSorted(sortDescending(array, sizeOf), sizeOf, capacity),
    'oversized': oversized,
  }
}

/**
 * Assumes {@link sorted} contains no oversized items and is sorted descending.
 * Does not modify {@link sorted}.
 * @param {*} sorted 
 * @param {*} sizeOf 
 * @param {*} capacity 
 */
 export function bestFitDecreasingSorted<T>(
    sorted: T[],
    sizeOf: (t: T) => number,
    capacity: number)
        : T[][] {
  const itemLeq = (item: T, _: SizedBin<T>[], bin: SizedBin<T>) =>
      sizeOf(item) <= capacity - bin.size
  const itemInsert = (item: T, sizedBins: SizedBin<T>[], i: number) => {
    if (i >= sizedBins.length) { // Will never be strictly >.
      sizedBins.push(new SizedBin())
    }
    sizedBins[i].size += sizeOf(item)
    sizedBins[i].bin.push(item)
  }
  // Sort it earlier if it's larger!
  const binMoreFull = (currentIndex: number, sizedBins: SizedBin<T>[], bin: SizedBin<T>) =>
      sizedBins[currentIndex].size >= bin.size
  const binResort = (currentIndex: number, sizedBins: SizedBin<T>[], i: number) => {
    if (i === currentIndex) {
      return
    }
    if (i > currentIndex) {
      throw new Error(`Algorithm error: newIndex ${i} > currentIndex ${currentIndex}`)
    }
    const binToMove = sizedBins[currentIndex]
    sizedBins.copyWithin(i + 1, i, currentIndex)
    sizedBins[i] = binToMove
  }

  const bins: SizedBin<T>[] = []
  for (const value of sorted) {
    // Insert item into (potentially new) bin
    const binIndex = binaryApply(bins, value, itemLeq, itemInsert)
    // Move updated bin to preserve sort
    binaryApply(bins, binIndex, binMoreFull, binResort)
  }
  return SizedBin.extractBins(bins)
}
