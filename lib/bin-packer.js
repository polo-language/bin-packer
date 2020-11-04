const quicksort = require('./util/quicksort')
const utils = require('./util/utils')

module.exports = {
  nextFit: nextFit,
  firstFit: firstFit,
  firstFitDecreasing: firstFitDecreasing,
  quicksort: quicksort.quicksort,
}

function nextFit(obj, measure, max) {
  const {valid: valid, invalid: invalid} = utils.validate(obj, utils.measureValidator.bind(null, measure))
      , bins = []
      , oversized = []
      , invalids = []
  let total = 0
      , blockNum = 0

  bins[blockNum] = []
  for (const value of valid) {
    if (value[measure] > max) {
      oversized.push(value)
    } else {
      total += value[measure]
      if (total > max) {
        blockNum += 1
        bins[blockNum] = []

        total = value[measure]
      }
      bins[blockNum].push(value)
    }
  }
  return {bins: bins, oversized: oversized, invalid: invalid}
}

function firstFitValidated(array, measure, max) {
  const bins = []
      , oversized = []
      , remaining = []
      , place = placeKey.bind(null, measure, max, bins, remaining)

  bins[0] = []
  remaining[0] = max
  for (const value of array) {
    if (value[measure] > max) {
      oversized.push(value)
    } else {
      place(value)
    }
  }
  return {'bins': bins, 'oversized': oversized}
}

function firstFit(obj, measure, max) {
  const {valid: valid, invalid: invalid} = utils.validate(obj, utils.measureValidator.bind(null, measure))
  const {'bins': bins, 'oversized': oversized} = firstFitValidated(valid, measure, max)
  return {'bins': bins, 'oversized': oversized, 'invalid': invalid}
}

function firstFitDecreasing(obj, measure, max) {
  const {sorted: sorted, invalid: invalid} = quicksort.quicksort(obj, measure, false)
  const {'bins': bins, 'oversized': oversized} = firstFitValidated(sorted, measure, max)
  return {'bins': bins, 'oversized': oversized, 'invalid': invalid}
}

/**
 * @param {string} measure 
 * @param {number} max 
 * @param {array} bins 
 * @param {array} remaining 
 * @param {object} value 
 */
function placeKey(measure, max, bins, remaining, value) {
  const size = value[measure]
  for (const i in bins) {
    if (size <= remaining[i]) {
      bins[i].push(value)
      remaining[i] -= size
      return
    }
  }
  // Else create a new bin, set the key-value there, and update its remaining size.
  bins[bins.length] = []
  bins[bins.length - 1].push(value)
  remaining[bins.length - 1] = max - size
}
