const quicksort = require('./util/quicksort-obj')

module.exports = {
  nextFit: nextFit,
  firstFit: firstFit,
  firstFitDecreasing: firstFitDecreasing,
  quicksortObj: quicksort.quicksortObj,
}

function nextFit(obj, measure, max, addOversize) {
  const bins = []
    , oversized = {}
  let total = 0
    , blockNum = 0

  bins[0] = {}
  for (const key in obj) {
    if (obj[key][measure] > max) {
      oversized[key] = obj[key]
      continue
    }

    total += obj[key][measure]
    if (total > max) {
      blockNum += 1
      bins[blockNum] = {}

      total = obj[key][measure]
    }
    bins[blockNum][key] = obj[key]
  }

  placeOversized(bins, oversized, addOversize)

  return bins
}

function firstFit(obj, measure, max, addOversize) {
  const bins = []
    , remaining = []
    , oversized = {}
    , place = placeKey.bind(null, obj, measure, max, bins, remaining, oversized)

  bins[0] = {}
  remaining[0] = max
  for (const key in obj) {
    place(key)
  }

  placeOversized(bins, oversized, addOversize)

  return bins
}

function firstFitDecreasing(obj, measure, max, addOversize) {
  const bins = []
    , remaining = []
    , oversized = {}
    , array = quicksort.quicksortObj(obj, measure)

  bins[0] = {}
  remaining[0] = max
  for (let item = array.length - 1; item > -1; --item) {
    const key = quicksort._getSingleKey(array[item])
    placeKey(array[item], measure, max, bins, remaining, oversized, key)
  }

  placeOversized(bins, oversized, addOversize)

  return bins
}

function placeKey(obj, measure, max, bins, remaining, oversized, key) {
  if (obj[key][measure] > max) {
    oversized[key] = obj[key]
    return
  }

  let placed = false
  for (const bin in bins) {

    if (obj[key][measure] <= remaining[bin]) {
      bins[bin][key] = obj[key]
      remaining[bin] -= obj[key][measure]
      placed = true
      break
    }
  }
  if (placed === false) {
    bins[bins.length] = {}
    bins[bins.length - 1][key] = obj[key]

    remaining[bins.length - 1] = max - obj[key][measure]
  }
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
