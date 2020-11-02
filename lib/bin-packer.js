const quicksort = require('./util/quicksort-obj')

module.exports = {
  nextFit: nextFit,
  firstFit: firstFit,
  firstFitDecreasing: firstFitDecreasing,
  quicksortObj: quicksort.quicksortObj,
}

function nextFit(obj, measure, max) {
  const bins = []
    , oversized = {}
    , invalids = {}
  let total = 0
    , blockNum = 0

  bins[blockNum] = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value !== 'object' || typeof value[measure] !== 'number') { // What about BigInt?
      invalids[key] = value
    } else if (value[measure] > max) {
      oversized[key] = value
    } else {
      total += value[measure]
      if (total > max) {
        blockNum += 1
        bins[blockNum] = {}

        total = value[measure]
      }
      bins[blockNum][key] = value
    }
  }

  return {bins: bins, oversized: oversized, invalid: invalids}
}

function firstFit(obj, measure, max, addOversize) {
  const bins = []
  , oversized = {}
  , invalids = {}
  , remaining = []
  , place = placeKey.bind(null, measure, max, bins, remaining)

  bins[0] = {}
  remaining[0] = max
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value !== 'object' || typeof value[measure] !== 'number') { // What about BigInt?
      invalids[key] = value
    } else if (value[measure] > max) {
      oversized[key] = value
    } else {
      place(key, value)
    }
  }

  return {bins: bins, oversized: oversized, invalid: invalids}
}

function firstFitDecreasing(obj, measure, max, addOversize) {
  const bins = []
    , remaining = []
    , oversized = {}
    , {sorted: array, invalid: invalid} = quicksort.quicksortObj(obj, measure)
    , place = placeKey.bind(null, measure, max, bins, remaining)

  bins[0] = {}
  remaining[0] = max
  for (let item = array.length - 1; item > -1; --item) {

    const key = quicksort._getSingleKey(array[item])
    const value = array[item][key]
    
    // Quicksort test for invalids so we don't need to do it here.
    if (value[measure] > max) {
      oversized[key] = value
    } else {
      place(key, value)
    }
  }

  return {bins: bins, oversized: oversized, invalid: invalid}
}

/**
 * Adds the 
 * @param {string} measure 
 * @param {number} max 
 * @param {array} bins 
 * @param {array} remaining 
 * @param {string} key 
 * @param {object} value 
 */
function placeKey(measure, max, bins, remaining, key, value) {

  const size = value[measure]

  for (const i in bins) {
    if (size <= remaining[i]) {
      bins[i][key] = value
      remaining[i] -= size
      return
    }
  }
  
  // Else create a new bin, set the key-value there, and update its remaining size.
  bins[bins.length] = {}
  bins[bins.length - 1][key] = value

  remaining[bins.length - 1] = max - size
}

function placeOversized(bins, oversized, addOversize) {
  if (addOversize) {
    for (const key in oversized) {
      bins[bins.length] = {}
      bins[bins.length - 1][key] = oversized[key]
    }
  } else {
    if (Object.keys(bins[bins.length - 1]).length === 0)
      bins[bins.length - 1] = oversized
    else
      bins.push(oversized) // pushes empty if no oversized for consistency
  }
}
