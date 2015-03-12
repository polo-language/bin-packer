module.exports = {
  nextFit: nextFit,
  firstFit: firstFit,
}

function nextFit(obj, measure, max, addOversized, callback) {
  var bins = []
    , oversized = {}
    , total = 0
    , blockNum = 0

  bins[blockNum] = {}
  for (var key in obj) {
    if (obj[key][measure] > max) {
      /*if (addOversize) {
        // adds new bin with single item larger than max
        bins[blockNum + 1] = bins[blockNum]
        bins[blockNum] = {}
        bins[blockNum][key] = obj[key]
        ;++blockNum
      } else {
        // TODO: handle error
        // this.emit('error', new Error(key + ' is too big for any bin - file skipped.'));
      }*/
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

  handleOversized(bins, oversized, addOversized, callback)
  //return bins
}

function firstFit(obj, measure, max /*, addOversize, callback*/) {
  var bins = []
    , remaining = []
    , placed

  bins[0] = {}
  remaining[0] = max
  for (var key in obj) {
    placed = false
    for (var bin in bins) {
      if (obj[key][measure] < remaining[bin]) {
        bins[bin][key] = obj[key]
        remaining[bin] -= obj[key][measure]
        placed = true
      }
    }
    if (placed === false) {
      bins[bins.length] = {}
      remaining[bins.length] = max

      bins[bin][key] = obj[key]
      remaining[bin] -= obj[key][measure]
    }
  }

  return bins
}

function handleOversized(bins, oversized, addOversized, callback) {
  if (addOversized) {
    for (var key in oversized) {
      bins[bins.length] = {}
      bins[bins.length - 1][key] = oversized[key]
    }
    callback(null, bins)
  } else {
    callback(oversized, bins)
  }
}

