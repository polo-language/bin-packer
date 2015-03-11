function nextFit(obj, measure, max, addOversize) {
  var bins = []
    , total = 0
    , blockNum = 0

  bins[blockNum] = {}
  for (var key in obj) {
    if (obj[key][measure] > max) {
      if (addOversize) {
        // adds new bin with single item larger than max
        bins[blockNum + 1] = bins[blockNum]
        bins[blockNum] = {}
        bins[blockNum][key] = obj[key]
        ;++blockNum
      } else {
        // TODO: handle error
        // this.emit('error', new Error(key + ' is too big for any bin - file skipped.'));
      }
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
  return bins
}

function firstFit(obj, measure, max /*, addOversize*/) {
  var bins = []
    , remaining = []
    , placed

  openNewBin(0)
  for (var key in obj) {
    placed = false
    for (var bin in bins) {
      if (obj[key][measure] < remaining[bin]) {
        place(key, bin)
      }
    }
    if (placed === false) {
      openNewBin(bins.length)
      place(key, bins.length)
    }
  }

  return bins

  function place(key, bin) {
    bins[bin][key] = obj[key]
    remaining[bin] -= obj[key][measure]
    placed = true
  }

  function openNewBin(i) {
    bins[i] = {}
    remaining[i] = max
  }
}


/*
To implement:
  Sort algorithm on objects into an array (array will be sorted with keys from object as values)
  First-Fit-Decreasing
  Modified-First-Fit-Decreasing
*/


/*FFD:
sort objects by size
then first fit

// sort files by size:
files.sort(compareBySize);
function compareBySize(a, b) {
  if (a.size < b.size) return -1;
  if (a.size > b.size) return 1;
  return 0;
}*/
