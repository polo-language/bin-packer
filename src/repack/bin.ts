import { Item }  from './item'
import { binaryApply } from '../util/binary-apply'
import { SwapPair } from '../util/utils'
import { MoveCallback } from '../index'

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
  get items(): Item[] {
    return this._items.slice()
  }

  get itemCount(): number {
    return this._items.length
  }

  /** Amount of free space remaining. May be negative. */
  get freeSpace(): number {
    return this.capacity - this.fill
  }

  /** Number of free slots remaining. May be negative. */
  get freeSlots(): number {
    return this.maxItems - this.itemCount
  }

  get fill(): number {
    return this._fill
  }

  /** Always non-negative, zero for bins within capacity. */
  get overfill(): number {
    return Math.max(0, -1 * this.freeSpace)
  }

  /** Removes the item at itemIndex. Adds it to the target bin if target is non-null. */
  moveOut(itemIndex: number, target: Bin | null, moveCallback: MoveCallback, stage: string): void {
    const item = this.remove(itemIndex)
    if (target !== null) {
      if (this.id === target.id) {
        throw new Error(`Algorithm error: `+
            `Trying to move item ${item.id} 'out' from bin ${this.id} to itself`)
      }
      target.addNonMove(item)
    }
    moveCallback(item.id, this.id, target ? target.id : null, stage, 'moveOut')
  }

  moveIn(item: Item, moveCallback: MoveCallback, stage: string, action?: string, fromBin?: Bin)
      : void {
    if (fromBin !== undefined &&
        item.currentBinId !== undefined &&
        fromBin.id !== item.currentBinId) {
      throw new Error(`Algorithm error: fromBin ${fromBin.id} not the same as item currentBinId `+
          item.currentBinId)
    }
    const priorBinId = fromBin !== undefined ?
        fromBin.id :
        (item.currentBinId !== undefined ? item.currentBinId : null)
    if (this._items.includes(item)) {
      throw new Error(`Algorithm error: `+
          `Trying to move item ${item.id} 'in' from bin ${this.id} to itself`)
    }
    this.addNonMove(item)
    moveCallback(
        item.id,
        priorBinId,
        this.id,
        stage,
        action === undefined ? 'moveIn' : action)
  }

  static swap(
      binPair: SwapPair<Bin>,
      itemIndexPair: SwapPair<number>,
      moveCallback: MoveCallback,
      stage: string): void {
    if (binPair.from.id === binPair.to.id) {
      throw new Error(`Algorithm error: `+
          `Trying to swap items between bin ${binPair.from.id} and itself`)
    }
    const fromItem = binPair.from.remove(itemIndexPair.from)
    const toItem = binPair.to.remove(itemIndexPair.to)
    binPair.from.moveIn(toItem, moveCallback, stage, 'swap', binPair.to)
    binPair.to.moveIn(fromItem, moveCallback, stage, 'swap', binPair.from)
  }

  addNonMove(item: Item): void {
    binaryApply(
        this._items,
        item,
        (a, _, b) => a.size <= b.size,
        (a, array, i) => { array.splice(i, 0, a) }
    )
    this._fill += item.size
    item.currentBinId = this.id
  }

  /**
   * Returns the index and size of the smallest item smaller or equal to max that is larger than the
   * bin's overutilization. If no element is large enough to cover the overutilization, the largest
   * possible item is removed. Returns a tuple of nulls if all items are larger than max.
   * May only be called on non-empty bins that are filled beyond capacity.
   */
  largestFromOverfill(max: number): { index: number, size: number } | null {
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
    return { index: index, size: this._items[index].size }
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
    removed.currentBinId = undefined
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
    this._items.forEach(item => cloned.addNonMove(item.deepClone()))
    return cloned
  }

  static capacityOf(bins: readonly Bin[]): number {
    return bins.reduce((acc: number, bin: Bin) => acc + bin.capacity, 0)
  }

  static slotsIn(bins: readonly Bin[]): number {
    return bins.reduce((acc: number, bin: Bin) => acc + bin.maxItems, 0)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  toJSON(_key: string): any {
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
