import { binaryApply } from './util/utils'

export class Item {
  newBinId?: string

  constructor(
      readonly id: string,
      readonly size: number,
      readonly originalBinId?: string
  ) { }

  static deepClone(item: Item): Item {
    const cloned = new Item(item.id, item.size, item.originalBinId)
    if (item.newBinId !== undefined) {
      cloned.newBinId = item.newBinId
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
  private _utilization: number

  constructor(
      readonly id: string,
      readonly capacity: number,
      readonly maxItems: number) {
    this._items = []
    this._utilization = 0
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
    return this.capacity - this.utilization
  }

  get freeSlots() {
    return Math.max(0, this.maxItems - this.itemCount)
  }

  get utilization() {
    return this._utilization
  }

  /** Always non-negative, zero for bins with no overutilization. */
  get overutilization() {
    return Math.max(0, -1 * this.freeSpace)
  }

  add(item: Item) {
    binaryApply(
        this._items,
        item,
        (a, _, b) => a.size <= b.size,
        (a, array, i) => { array.splice(i, 0, a) }
    )
    this._utilization += item.size
    item.newBinId = this.id
  }

  removeFromOverutilization(max: number) {
    if (this.itemCount === 0) {
      throw new Error('Can not remove item from empty bin')
    }
    if (!this.isOverutilized()) {
      throw new Error('Bin is not overutilized')
    }
    if (max < this._items[0].size) {
      throw new Error(`No item is smaller than ${max}`)
    }
    const softMin = this.overutilization
    const maxIndex = this._items.length - 1
    const index = softMin <= max ?
        (this._items[maxIndex].size < softMin ?
            maxIndex :
            this._items.findIndex(item => softMin <= item.size)) :
        (this._items[maxIndex].size < max ?
            maxIndex :
            this._items.findIndex(item => max <= item.size) - 1) // Safe since item zero is smaller
    return this.remove(index)
  }

  remove(index: number): Item {
    if (index < 0 || this._items.length - 1 < index) {
      throw new Error(`Cannot remove item at index ${index} from array of length `+
          `${this._items.length}`)
    }
    const removed = this._items.splice(index, 1)[0]
    this._utilization -= removed.size
    removed.newBinId = undefined
    return removed
  }

  isOpen(): boolean {
    return this.freeSlots > 0 && this.freeSpace > 0
  }

  isFull(): boolean {
    return !this.isOpen() && !this.isOverutilized()
  }

  isOverutilized(): boolean {
    return this.maxItems < this.itemCount || this.capacity < this.utilization
  }

  static deepClone(bin: Bin): Bin {
    const cloned = new Bin(bin.id, bin.capacity, bin.maxItems)
    bin._items.forEach(item => cloned.add(Item.deepClone(item)))
    return cloned
  }

  toString(): string {
    const status = this.isOverutilized() ? 'overutilized' : (this.isOpen() ? 'open' : 'full')
    return `ID: ${this.id}, capacity: ${this.capacity}, maxItems: ${this.maxItems}, `+
        `utilization: ${this.utilization}, itemCount: ${this.itemCount}, status: ${status}, `+
        `items: [${this._items.map(item => item.id).join(', ')}]`
  }
}

export class Move {
  constructor(
    readonly item: Item,
    readonly fromBinId: string | undefined,
    readonly toBinId: string
  ) { }
}

export class Analysis {
  readonly freeSlots: Metric
  readonly freeSpace: Metric
  readonly binsWithSpace: { '-': number, '0': number, '+': number }
  readonly binsWithSlots: { '-': number, '0': number, '+': number }
  readonly itemCount: number
  readonly moveCount: number
  readonly moveRatio: number
  readonly moves: Move[]

  constructor(bins: Bin[]) {
    this.freeSlots = Analysis.calculate(bins, bin => bin.freeSlots)
    this.freeSpace = Analysis.calculate(bins, bin => bin.freeSpace)
    let freeSpaceBins: [number, number, number] = [0, 0, 0]
    let freeSlotsBins: [number, number, number] = [0, 0, 0]
    let itemCount = 0
    const moves: Move[] = []
    for (const bin of bins) {
      ++freeSpaceBins[1 + Math.sign(bin.freeSpace)]
      ++freeSlotsBins[1 + Math.sign(bin.maxItems - bin.itemCount)]
      for (const item of bin.items) {
        ++itemCount
        if (item.hasMoved()) {
          // if (item.newBinId === undefined) {
          //   errorHandler.handle(`Item with ID ${item.id} not assigned to a new bin`)
          // } else {
            moves.push(new Move(item, item.originalBinId, item.newBinId!))
          // }
        }
      }
    }
    this.moves = moves
    this.itemCount = itemCount
    this.moveCount = this.moves.length
    this.moveRatio = this.moveCount / itemCount
    this.binsWithSpace = { '-': freeSpaceBins[0], '0': freeSpaceBins[1], '+': freeSpaceBins[2] }
    this.binsWithSlots = { '-': freeSlotsBins[0], '0': freeSlotsBins[1], '+': freeSlotsBins[2] }
  }

  private static calculate(bins: Bin[], numeric: (bin: Bin) => number): Metric {
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

export interface Metric {
  readonly total: number
  readonly min: number
  readonly avg: number
  readonly max: number
}