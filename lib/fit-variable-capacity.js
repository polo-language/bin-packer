'use strict'

const utils = require('./util/utils')

module.exports = {
  nextFitVarCap,
}

class Bin {
  constructor(id, capacity) {
    this.id = id
    this.capacity = capacity
    this.utilization = 0
    this.items = []
  }

  fits(size) {
    return this.utilization + size <= this.capacity
  }

  add(item, size) {
    this.items.push(item)
    this.utilization += size
  }

  isEmpty() {
    return this.length === 0
  }

  get length() {
    return this.items.length
  }
}

/**
 * Re-orders bins in place by bin creation order.
 * @param {Bin[]} bins      Modified in place
 * @returns {Bin[]} bins    For chaining
 */
function sortBins(bins) {
  return utils.sortAscending(bins, bin => bin.id)
}

/**
 * 
 * @param {*} obj 
 * @param {function} sizeOf 
 * @param {Iterable} capacities 
 */
function nextFitVarCap(obj, sizeOf, capacities) {
  const array = utils.prepareValuesNoCapacity(obj, sizeOf)
  const bins = []
  const oversized = []
  const unreached = []
  const nextBin = (function () {
    const capacitiesIter = utils.adaptCapacityToIterable(capacities)
    let nextBinId = 0
    return () => {
      const next = capacitiesIter.next()
      if (next.done) {
        return null
      } else {
        return new Bin(nextBinId++, next.value)
      }
    }
  })()
  let currentBin = nextBin()
  if (!currentBin) {
    throw new Error('Capacities must provide at least one bin capacity')
  }
  // When toggled to 'true', all remaining items added to 'unreached', no further bins are created.
  let drainToUnreached = false
  for (const item of array) {
    // Received the 'shut down' signal?
    if (drainToUnreached) {
      unreached.push(item)
    } else {
      const size = sizeOf(item)
      // Add it to the current bin if it fits.
      if (currentBin.fits(size)) {
        currentBin.add(item, size)
      } else {
        // Doesn't fit in an empty bin, so item is too big.
        if (currentBin.isEmpty()) {
          oversized.push(item)
        } else {
          // Doesn't fit in a non-empty bin, so open a new one.
          bins.push(currentBin)
          currentBin = nextBin()
          // Capacity iterator isn't supplying any more bins, remaining items will be 'unreached'.
          if (!currentBin) {
            oversized.push(item)
            drainToUnreached = true
          } else {
            // See if item fits in the new bin
            if (currentBin.fits(size)) {
              currentBin.add(item, size)
            } else {
              // Doesn't fit in an empty bin, so item is too big.
              oversized.push(item)
            }
          }
        }
      }
    }
  }
  if (!currentBin.isEmpty()) {
    bins.push(currentBin)
  }
  return {bins: sortBins(bins), oversized: oversized, unreached: unreached,}
}
