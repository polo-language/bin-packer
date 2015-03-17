module.exports = {
  nextFit: nextFit,
  firstFit: firstFit,
  firstFitDecreasing: firstFitDecreasing,
}

function nextFit(obj, measure, max, addOversize) {
  var bins = []
    , oversized = {}
    , total = 0
    , blockNum = 0

  bins[blockNum] = {}
  for (var key in obj) {
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

  return getReturn(bins, oversized, addOversize)
}

function firstFit(obj, measure, max, addOversize) {
  var bins = []
    , remaining = []
    , oversized = {}
    , place = placeKey.bind(null, obj, measure, max, bins, remaining, oversized)

  bins[0] = {}
  remaining[0] = max
  for (var key in obj) {
    place(key)
  }

  return getReturn(bins, oversized, addOversize)
}

function firstFitDecreasing(obj, measure, max, addOversize) {
  var quicksort = require('./quicksort-obj')
    , bins = []
    , remaining = []
    , oversized = {}
    , place
    , array = quicksort.quickSortObj(obj, measure)

  bins[0] = {}
  remaining[0] = max
  for (var item in array) {
    place = placeKey.bind(null, array[item], measure, max, bins, remaining, oversized)
    place(quicksort._getSingleKey(array[item]))
  }

  return getReturn(bins, oversized, addOversize)
}

function placeKey(obj, measure, max, bins, remaining, oversized, key) {
  if (obj[key][measure] > max) {
    oversized[key] = obj[key]
    return
  }

  var placed = false
  for (var bin in bins) {
    if (obj[key][measure] < remaining[bin]) {
      bins[bin][key] = obj[key]
      remaining[bin] -= obj[key][measure]
      placed = true
      break
    }
  }
  if (placed === false) {
    bins[bins.length] = {}
    remaining[bins.length] = max

    bins[bin][key] = obj[key]
    remaining[bin] -= obj[key][measure]
  }
}

function getReturn(bins, oversized, addOversize) {
  if (addOversize) {
    for (var key in oversized) {
      bins[bins.length] = {}
      bins[bins.length - 1][key] = oversized[key]
    }
    return bins
  } else {
    bins.push(oversized)
    return bins
  }
}
