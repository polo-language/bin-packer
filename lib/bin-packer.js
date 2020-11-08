'use strict'

const quicksort = require('./util/quicksort')
const utils = require('./util/utils')

module.exports = {
  nextFit: nextFit,
  firstFit: firstFit,
  firstFitDecreasing: firstFitDecreasing,
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
