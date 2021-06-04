import { InputObject } from "../index"
import { adaptToNumberIterable, prepareValuesNoCapacity } from "../util/prepare-values"
import { sortAscending } from "../util/utils"

class Bin<T> {
  utilization: number
  items: T[]

  constructor(readonly id: number, readonly capacity: number) {
    this.id = id
    this.capacity = capacity
    this.utilization = 0
    this.items = []
  }

  fits(size: number): boolean {
    return this.utilization + size <= this.capacity
  }

  add(item: T, size: number) {
    this.items.push(item)
    this.utilization += size
  }

  isEmpty(): boolean {
    return this.length === 0
  }

  get length(): number {
    return this.items.length
  }
}

/**
 * 
 * @param {*} obj 
 * @param {function} sizeOf 
 * @param {Iterable} capacities 
 */
 export function nextFitVarCap<T>(
    obj: InputObject<T>,
    sizeOf: (t: T) => number,
    capacities: number | Iterable<number> | (() => Iterable<number>)) {
  const array = prepareValuesNoCapacity(obj, sizeOf)
  const bins = []
  const oversized = []
  const unreached = []
  const nextBin = (function () {
    const capacitiesIter = adaptToNumberIterable(capacities)[Symbol.iterator]()
    let nextBinId = 0
    return () => {
      const next = capacitiesIter.next()
      if (next.done) {
        return null
      } else {
        return new Bin<T>(nextBinId++, next.value)
      }
    }
  })()
  let currentBin = nextBin()
  if (currentBin === null) {
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
      if (currentBin!.fits(size)) {
        currentBin!.add(item, size)
      } else {
        // Doesn't fit in an empty bin, so item is too big.
        if (currentBin!.isEmpty()) {
          oversized.push(item)
        } else {
          // Doesn't fit in a non-empty bin, so open a new one.
          bins.push(currentBin!)
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
  if (currentBin !== null && !currentBin.isEmpty()) {
    bins.push(currentBin)
  }
  return {
    bins: sortAscending(bins, bin => bin.id), // Sorted by bin creation order.
    oversized: oversized,
    unreached: unreached
  }
}
