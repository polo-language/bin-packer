import { Item }  from './item'
import { binaryApply } from '../util/binary-apply'
import { SwapPair } from '../util/utils'

export class Bin {
  /** Maintained in order of increasing size. */
  private _items: Item[]
  private _fill: number

  constructor(
      readonly id: string,
      readonly capacity: number,
      readonly maxItems: number,
      readonly moveCallback: (item: Item, from: Bin | null, to: Bin | null) => void) {
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

  /** Amount of free space remaining. May be negative. */
  get freeSpace() {
    return this.capacity - this.fill
  }

  /** Number of free slots remaining. May be negative. */
  get freeSlots() {
    return this.maxItems - this.itemCount
  }

  get fill() {
    return this._fill
  }

  /** Always non-negative, zero for bins within capacity. */
  get overfill() {
    return Math.max(0, -1 * this.freeSpace)
  }

  /**
   * Moves the item at index itemIndex to the target bin, if it is non-null.
   */
  moveOut(itemIndex: number, target: Bin | null) {
    const item = this.remove(itemIndex)
    if (target !== null) {
      target.addNonMove(item)
    }
    this.moveCallback(item, this, target)
  }

  moveIn(item: Item) {
    this.addNonMove(item)
    this.moveCallback(item, null, this)
  }

  static swap(binPair: SwapPair<Bin>, itemIndexPair: SwapPair<number>) {
    const fromItem = binPair.from.remove(itemIndexPair.from)
    const toItem = binPair.to.remove(itemIndexPair.to)
    binPair.from.moveIn(toItem)
    binPair.to.moveIn(fromItem)
  }

  addNonMove(item: Item) {
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
   * Returns the index and size of the smallest item smaller or equal to max that is larger than the
   * bin's overutilization. If no element is large enough to cover the overutilization, the largest
   * possible item is removed. Returns a tuple of nulls if all items are larger than max.
   * May only be called on non-empty bins that are filled beyond capacity.
   */
  largestFromOverfill(max: number): [number | null, number | null] {
    if (this.itemCount === 0) {
      throw new Error('Can not remove item from empty bin')
    }
    if (!this.isOverfull()) {
      throw new Error('Bin is not over capacity')
    }
    if (max < this._items[0].size) {
      // No item is smaller than max.
      return [null, null]
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
    return [index, this._items[index].size]
  }

  /** May only be called when at least one element is less than max. */
  private smallestIndexOfItemWithSizeLessOrEqual(max: number): number {
    const maxIndex = this._items.length - 1
    return this._items[maxIndex].size <= max ?
        maxIndex :
        this._items.findIndex(item => max < item.size) - 1 // Safe since item zero is smaller.
  }

  private remove(index: number): Item {
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
    const cloned = new Bin(this.id, this.capacity, this.maxItems, this.moveCallback)
    this._items.forEach(item => cloned.addNonMove(item.deepClone()))
    return cloned
  }

  static capacityOf(bins: readonly Bin[]): number {
    return bins.reduce((acc: number, bin: Bin) => acc + bin.capacity, 0)
  }

  static slotsIn(bins: readonly Bin[]): number {
    return bins.reduce((acc: number, bin: Bin) => acc + bin.maxItems, 0)
  }

  toJSON(key: string): any {
    return {
      'ID': this.id,
      'capacity': this.capacity,
      'maxItems': this.maxItems,
      'fill': this.fill,
      'itemCount': this.itemCount,
      'status': this.isOverutilized() ? 'overutilized' : (this.isOpen() ? 'open' : 'full'),
      'freeSlots': this.freeSlots,
      'freeSpace': this.freeSpace,
      'smallestItemSize': this.itemCount === 0 ? 'n/a' : this._items[0].size,
      'largestItemSize': this.itemCount === 0 ? 'n/a' : this._items[this.itemCount - 1].size,
      'items': this._items.map(item => item.id)
    }
  }

  toString(): string {
    return JSON.stringify(this)
  }
}
