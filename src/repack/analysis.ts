import { Bin }  from '../repack/bin'
import { Item }  from '../repack/item'
import { stdDev } from '../util/utils'

export class Analysis {
  readonly binCount: number
  readonly totalSpace: number
  readonly totalSlots: number
  readonly freeSpace: Metric
  readonly freeSlots: Metric
  readonly binsWithSpace: { '-': number, '0': number, '+': number }
  readonly binsWithSlots: { '-': number, '0': number, '+': number }
  readonly itemCount: number
  readonly moveCount: number
  readonly insertCount: number
  readonly moveRatio: number
  readonly movedItems: Item[]

  constructor(bins: readonly Bin[]) {
    this.binCount = bins.length
    this.totalSpace = Bin.capacityOf(bins)
    this.totalSlots = Bin.totalSlots(bins)
    this.freeSlots = newMetric(bins, bin => bin.freeSlots)
    this.freeSpace = newMetric(bins, bin => bin.freeSpace)
    const binIds = new Set(bins.map(bin => bin.id))
    const freeSpaceBins: [number, number, number] = [0, 0, 0]
    const freeSlotsBins: [number, number, number] = [0, 0, 0]
    let itemCount = 0
    let moveCount = 0
    let insertCount = 0
    const movedItems: Item[] = []
    for (const bin of bins) {
      ++freeSpaceBins[1 + Math.sign(bin.freeSpace)]
      ++freeSlotsBins[1 + Math.sign(bin.maxItems - bin.itemCount)]
      for (const item of bin.items) {
        ++itemCount
        if (item.hasMoved()) {
          if (item.originalBinId === undefined || !binIds.has(item.originalBinId)) {
            ++insertCount
          } else {
            ++moveCount
          }
          movedItems.push(item)
        }
      }
    }
    this.movedItems = movedItems
    this.itemCount = itemCount
    this.moveCount = moveCount
    this.insertCount = insertCount
    this.moveRatio = this.moveCount / (itemCount - insertCount)
    this.binsWithSpace = { '-': freeSpaceBins[0], '0': freeSpaceBins[1], '+': freeSpaceBins[2] }
    this.binsWithSlots = { '-': freeSlotsBins[0], '0': freeSlotsBins[1], '+': freeSlotsBins[2] }
  }
}

export class ItemAnalysis {
  readonly itemCount: number
  readonly size: Metric

  constructor(items: Item[]) {
    this.itemCount = items.length
    this.size = newMetric(items, item => item.size)
  }
}

export interface Metric {
  readonly total: number
  readonly min: number
  readonly avg: number
  readonly max: number
  readonly range: number
  readonly stdDev: number
}

function newMetric<T>(t: readonly T[], numeric: (t: T) => number): Metric {
  if (0 === t.length) {
    return {
      total: 0,
      min: 0,
      avg: 0,
      max: 0,
      range: 0,
      stdDev: 0,
    }
  } else {
    const values = t.map(numeric)
    const total = values.reduce((acc, val) => acc + val)
    const min = Math.min.apply(undefined, values)
    const max = Math.max.apply(undefined, values)
    return {
      total: total,
      min: min,
      avg: total / values.length,
      max: max,
      range: max - min,
      stdDev: stdDev(values),
    }
  }
}
