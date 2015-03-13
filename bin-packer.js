module.exports = {
  nextFit: nextFit,
  firstFit: firstFit,
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
    , placed

  bins[0] = {}
  remaining[0] = max
  for (var key in obj) {
    if (obj[key][measure] > max) {
      oversized[key] = obj[key]
      continue
    }

    placed = false
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

  return getReturn(bins, oversized, addOversize)
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
