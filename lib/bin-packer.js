'use strict'

const quicksort = require('./util/quicksort')
const utils = require('./util/utils')

module.exports = {
  nextFit,
  firstFit,
  firstFitDecreasing,
  bestFitDecreasing,
  quicksort: quicksort.quicksort,
}

function nextFit(obj, sizeOf, max) {
  const bins = []
      , oversized = []
  let currentBinSize = max + 1 // Start out with an imaginary bin that's full.
      , blockNum = -1

  for (const value of utils.toArray(obj)) {
    const size = sizeOf(value)
    if (size > max) {
      oversized.push(value)
    } else {
      currentBinSize += size
      if (currentBinSize > max) {
        ++blockNum
        bins[blockNum] = []

        currentBinSize = size
      }
      bins[blockNum].push(value)
    }
  }
  return {bins: bins, oversized: oversized,}
}

function firstFitArray(array, sizeOf, max) {
  const bins = []
      , oversized = []
      , remaining = []

  for (const value of array) {
    const size = sizeOf(value)
    if (size > max) {
      oversized.push(value)
    } else {
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
        remaining[bins.length - 1] = max - size
      }
    }
  }
  return {'bins': bins, 'oversized': oversized,}
}

function firstFit(obj, sizeOf, max) {
  return firstFitArray(utils.toArray(obj), sizeOf, max)
}

function firstFitDecreasing(obj, sizeOf, max) {
  return firstFitArray(quicksort.quicksort(obj, sizeOf, false), sizeOf, max)
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

function bestFitDecreasing(obj, sizeOf, max) {
  const itemLeq = (item, _, bin) => sizeOf(item) <= max - bin.size
      , itemInsert = (item, sizedBins, i) => {
        if (i >= sizedBins.length) { // Will never be strictly >.
          sizedBins.push(new SizedBin())
        }
        sizedBins[i].size += sizeOf(item)
        sizedBins[i].bin.push(item)
      }
      , binLeq = (currentIndex, sizedBins, bin) => sizedBins[currentIndex].size >= bin.size // Sort it earlier if it's larger!
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

  const sorted = quicksort.quicksort(obj, sizeOf, false)
      , bins = []
      , oversized = []

  for (const value of sorted) {
    const size = sizeOf(value)
    if (size > max) {
      oversized.push(value)
    } else {
      // Insert item into (potentially new) bin
      const binIndex = utils.binaryApply(bins, value, itemLeq, itemInsert)
      // Move updated bin to preserve sort
      utils.binaryApply(bins, binIndex, binLeq, binResort)
    }
  }
  return {'bins': SizedBin.extractBins(bins), 'oversized': oversized,}
}
