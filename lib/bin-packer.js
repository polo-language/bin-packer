'use strict'

const quicksort = require('./util/quicksort')
const utils = require('./util/utils')

module.exports = {
  nextFit,
  firstFit,
  firstFitDecreasing,
  bestFitDecreasing,
  lowerBound1,
  lowerBound2,
  quicksort: quicksort.quicksort,
}

function nextFit(obj, sizeOf, capacity) {
  const bins = []
      , oversized = []
  let currentBinSize = capacity + 1 // Start out with an imaginary bin that's full.
      , blockNum = -1

  for (const value of utils.toArray(obj)) {
    const size = utils.validateNumber(sizeOf(value))
    if (size > capacity) {
      oversized.push(value)
    } else {
      currentBinSize += size
      if (currentBinSize > capacity) {
        ++blockNum
        bins[blockNum] = []

        currentBinSize = size
      }
      bins[blockNum].push(value)
    }
  }
  return {bins: bins, oversized: oversized,}
}

function firstFitArray(array, sizeOf, capacity) {
  const bins = []
      , oversized = []
      , remaining = []

  for (const value of array) {
    const size = sizeOf(value)
    if (size > capacity) {
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
        remaining[bins.length - 1] = capacity - size
      }
    }
  }
  return {'bins': bins, 'oversized': oversized,}
}

function firstFit(obj, sizeOf, capacity) {
  const array = utils.toArray(obj)
  for (const item of array) {
    utils.validateNumber(sizeOf(item))
  }
  return firstFitArray(array, sizeOf, capacity)
}

function firstFitDecreasing(obj, sizeOf, capacity) {
  return firstFitArray(quicksort.quicksort(obj, sizeOf, false), sizeOf, capacity)
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

  const sorted = quicksort.quicksort(obj, sizeOf, false)
      , bins = []
      , oversized = []

  for (const value of sorted) {
    if (sizeOf(value) > capacity) {
      oversized.push(value)
    } else {
      // Insert item into (potentially new) bin
      const binIndex = utils.binaryApply(bins, value, itemLeq, itemInsert)
      // Move updated bin to preserve sort
      utils.binaryApply(bins, binIndex, binMoreFull, binResort)
    }
  }
  return {'bins': SizedBin.extractBins(bins), 'oversized': oversized,}
}

/**
 * A simple-to-compute lower bound on the number of bins required by an optimal solution.
 * Computes the nubmer of bins required if elements' sizes could be split across bins to fill each completely before
 * opening a new one.
 * @param {*} obj 
 * @param {*} sizeOf 
 * @param {*} capacity 
 */
function lowerBound1(obj, sizeOf, capacity) {
  return Math.ceil(utils.toArray(obj).reduce((acc, cur) => acc += sizeOf(cur), 0) / capacity)
}

/**
 * Martello and Toth's L2 lower bound on the number of bins required by an optimal solution. Combines the methodology of
 * the L1 lower bound with the addition of a 'waste' component for each bin that can be shown not to be fully fillable.
 * @param {*} obj 
 * @param {*} sizeOf 
 * @param {*} capacity 
 */
function lowerBound2(obj, sizeOf, capacity) {
  const sortedArray = utils.toArray(obj).sort((left, right) => right - left)
  let waste = 0
      , carry = 0
      , elementTotal = 0 // Calculate as we go since we've got to visit each element at least once anyway.
  while (sortedArray.length > 0) {
    const largestSize = sizeOf(sortedArray.pop())
    elementTotal += largestSize
    const remainder = capacity - largestSize
    const firstLargerThanRemainder = sortedArray.findIndex(function (element) {
      return sizeOf(element) > remainder
    })
    const smallerCount = firstLargerThanRemainder === -1 ? sortedArray.length : firstLargerThanRemainder // Not an off-by-one error :)
    const smallerTotal = smallerCount > 0
          ? sortedArray.splice(0, smallerCount).reduce((acc, cur) => acc += sizeOf(cur), 0)
          : 0
    elementTotal += smallerTotal
    const accumulatedSmaller = carry + smallerTotal
    if (remainder < accumulatedSmaller) {
      carry += accumulatedSmaller - remainder
    } else if (remainder > accumulatedSmaller) {
      waste += remainder - accumulatedSmaller
    }
  }
  return Math.ceil((waste + elementTotal) / capacity)
}
