import { binaryApply } from './util/utils'

export class Item {
  newBinId?: string

  constructor(
      readonly id: string,
      readonly size: number,
      readonly originalBinId?: string
  ) { }

  deepClone(): Item {
    const cloned = new Item(this.id, this.size, this.originalBinId)
    if (this.newBinId !== undefined) {
      cloned.newBinId = this.newBinId
    }
    return cloned
  }

  hasMoved(): boolean {
    return this.originalBinId !== this.newBinId
  }

  toString(): string {
    return `ID: ${this.id}, size: ${this.size}, fromBin: ${this.originalBinId}, `+
        `toBin: ${this.newBinId}`
  }
}

export class Bin {
  /** Maintained in order of increasing size. */
  private _items: Item[]
  private _fill: number

  constructor(
      readonly id: string,
      readonly capacity: number,
      readonly maxItems: number) {
    this._items = []
    this._fill = 0
  }

  /** Returns a copy of the item array. */
  get items() {
    return this._items.slice()
  }

  get itemCount() {
    return this._items.length
  }

  /** May be negative. */
  get freeSpace() {
    return this.capacity - this.fill
  }

  get freeSlots() {
    return Math.max(0, this.maxItems - this.itemCount)
  }

  get fill() {
    return this._fill
  }

  /** Always non-negative, zero for bins within capacity. */
  get overfill() {
    return Math.max(0, -1 * this.freeSpace)
  }

  add(item: Item) {
    binaryApply(
        this._items,
        item,
        (a, _, b) => a.size <= b.size,
        (a, array, i) => { array.splice(i, 0, a) }
    )
    this._fill += item.size
    item.newBinId = this.id
  }

  /**
   * Removes and returns the smallest item smaller or equal to max that is larger than the bin's
   * overutilization. If no element is large enough to cover the overutilization, the largest
   * possible item is removed. Returns null if all items are larger than max.
   * May only be called on non-empty bins that are filled beyond capacity.
   */
  removeFromOverfill(max: number): Item | null {
    if (this.itemCount === 0) {
      throw new Error('Can not remove item from empty bin')
    }
    if (!this.isOverfull()) {
      throw new Error('Bin is not over capacity')
    }
    if (max < this._items[0].size) {
      // No item is smaller than max.
      return null
    }
    const softMin = this.overfill
    const maxIndex = this._items.length - 1
    const index = softMin <= max
        ? (this._items[maxIndex].size < softMin ?
            maxIndex :
            Math.min(
                this._items.findIndex(item => softMin <= item.size),
                this.smallestIndexOfItemWithSizeLessOrEqual(max)))
        : this.smallestIndexOfItemWithSizeLessOrEqual(max)
    return this.remove(index)
  }

  /** May only be called when at least one element is less than max. */
  private smallestIndexOfItemWithSizeLessOrEqual(max: number): number {
    const maxIndex = this._items.length - 1
    return this._items[maxIndex].size <= max ?
        maxIndex :
        this._items.findIndex(item => max < item.size) - 1 // Safe since item zero is smaller.
  }

  remove(index: number): Item {
    if (index < 0 || this._items.length - 1 < index) {
      throw new Error(`Cannot remove item at index ${index} from array of length `+
          `${this._items.length}`)
    }
    const removed = this._items.splice(index, 1)[0]
    this._fill -= removed.size
    removed.newBinId = undefined
    return removed
  }

  isOpen(): boolean {
    return this.freeSlots > 0 && this.freeSpace > 0
  }

  isOverfull(): boolean {
    return this.capacity < this.fill
  }

  private isOverutilized(): boolean {
    return this.maxItems < this.itemCount || this.isOverfull()
  }

  deepClone(): Bin {
    const cloned = new Bin(this.id, this.capacity, this.maxItems)
    this._items.forEach(item => cloned.add(item.deepClone()))
    return cloned
  }

  toString(): string {
    const status = this.isOverutilized() ? 'overutilized' : (this.isOpen() ? 'open' : 'full')
    return `ID: ${this.id}, capacity: ${this.capacity}, maxItems: ${this.maxItems}, `+
        `utilization: ${this.fill}, itemCount: ${this.itemCount}, status: ${status}, `+
        `items: [${this._items.map(item => item.id).join(', ')}]`
  }
}

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
  readonly moveRatio: number
  readonly movedItems: Item[]

  constructor(bins: readonly Bin[]) {
    this.binCount = bins.length
    this.totalSpace = Analysis.totalCapacity(bins)
    this.totalSlots = Analysis.totalSlots(bins)
    this.freeSlots = Analysis.calculate(bins, bin => bin.freeSlots)
    this.freeSpace = Analysis.calculate(bins, bin => bin.freeSpace)
    let freeSpaceBins: [number, number, number] = [0, 0, 0]
    let freeSlotsBins: [number, number, number] = [0, 0, 0]
    let itemCount = 0
    const movedItems: Item[] = []
    for (const bin of bins) {
      ++freeSpaceBins[1 + Math.sign(bin.freeSpace)]
      ++freeSlotsBins[1 + Math.sign(bin.maxItems - bin.itemCount)]
      for (const item of bin.items) {
        ++itemCount
        if (item.hasMoved()) {
          // if (item.newBinId === undefined) {
          //   errorHandler.handle(`Item with ID ${item.id} not assigned to a new bin`)
          // } else {
            movedItems.push(item)
          // }
        }
      }
    }
    this.movedItems = movedItems
    this.itemCount = itemCount
    this.moveCount = this.movedItems.length
    this.moveRatio = this.moveCount / itemCount
    this.binsWithSpace = { '-': freeSpaceBins[0], '0': freeSpaceBins[1], '+': freeSpaceBins[2] }
    this.binsWithSlots = { '-': freeSlotsBins[0], '0': freeSlotsBins[1], '+': freeSlotsBins[2] }
  }

  private static calculate(bins: readonly Bin[], numeric: (bin: Bin) => number): Metric {
    if (0 === bins.length) {
      return {
        total: 0,
        min: 0,
        avg: 0,
        max: 0
      }
    } else {
      const values = bins.map(numeric)
      const total = values.reduce((acc, val) => acc + val)
      return {
        total: total,
        min: Math.min(...values),
        avg: total / values.length,
        max: Math.max(...values)
      }
    }
  }

  static totalCapacity(bins: readonly Bin[]): number {
    return bins.reduce((acc: number, bin: Bin) => acc + bin.capacity, 0)
  }

  static totalSlots(bins: readonly Bin[]): number {
    return bins.reduce((acc: number, bin: Bin) => acc + bin.maxItems, 0)
  }
}

export interface Metric {
  readonly total: number
  readonly min: number
  readonly avg: number
  readonly max: number
}
