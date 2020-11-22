'use strict'

const utils = require('./util/utils')

module.exports = {
  nextFit,
  firstFit,
  firstFitDecreasing,
  bestFitDecreasing,
  bestFitDecreasingSorted,
}

function nextFit(obj, sizeOf, capacity) {
  const {array: array, oversized: oversized} = utils.prepareValues(obj, sizeOf, capacity)
      , bins = []
  let currentBinSize = capacity + 1 // Start out with an imaginary bin that's full.
      , blockNum = -1

  for (const value of array) {
    const size = sizeOf(value)
    currentBinSize += size
    if (currentBinSize > capacity) {
      ++blockNum
      bins[blockNum] = []

      currentBinSize = size
    }
    bins[blockNum].push(value)
  }
  return {bins: bins, oversized: oversized,}
}

function firstFit(obj, sizeOf, capacity) {
  return firstFitArray(obj, sizeOf, capacity, false)
}

function firstFitDecreasing(obj, sizeOf, capacity) {
  return firstFitArray(obj, sizeOf, capacity, true)
}

function firstFitArray(obj, sizeOf, capacity, presort) {
  const {array: array, oversized: oversized} = utils.prepareValues(obj, sizeOf, capacity)
      , bins = []
      , remaining = []

  if (presort) {
    utils.sortDescending(array, sizeOf)
  }

  for (const value of array) {
    const size = sizeOf(value)
    let createNewBin = true
    for (const i in bins) {
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

class SizedBin {
  constructor() {
    this.bin = []
    this.size = 0
  }
  
  static extractBins(sizedBins) {
    return sizedBins.map(sizedBin => sizedBin.bin)
  }
}

function bestFitDecreasing(obj, sizeOf, capacity) {
  const {array: array, oversized: oversized} = utils.prepareValues(obj, sizeOf, capacity)
  return {
    'bins': bestFitDecreasingSorted(utils.sortDescending(array, sizeOf), sizeOf, capacity),
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
function bestFitDecreasingSorted(sorted, sizeOf, capacity) {
  const itemLeq = (item, _, bin) => sizeOf(item) <= capacity - bin.size
      , itemInsert = (item, sizedBins, i) => {
        if (i >= sizedBins.length) { // Will never be strictly >.
          sizedBins.push(new SizedBin())
        }
        sizedBins[i].size += sizeOf(item)
        sizedBins[i].bin.push(item)
      }
      , binMoreFull = (currentIndex, sizedBins, bin) => sizedBins[currentIndex].size >= bin.size // Sort it earlier if it's larger!
      , binResort = (currentIndex, sizedBins, i) => {
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

  const bins = []
  for (const value of sorted) {
    // Insert item into (potentially new) bin
    const binIndex = utils.binaryApply(bins, value, itemLeq, itemInsert)
    // Move updated bin to preserve sort
    utils.binaryApply(bins, binIndex, binMoreFull, binResort)
  }
  return SizedBin.extractBins(bins)
}
