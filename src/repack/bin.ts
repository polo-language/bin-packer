import { Item }  from './item'
import { binaryApply } from '../util/binary-apply'
import { SwapPair } from '../util/utils'
import { MoveCallback } from '../index'
import { Move } from '../sequence/move'

export class Bin {
  /** Maintained in order of increasing size. */
  private _items: Item[]
  private _fill: number

  constructor(
      readonly id: string,
      readonly capacity: number,
      readonly maxItems: number,
      readonly displayMaxItems: number) {
    if (capacity < 0) {
      throw new Error(`Bin ${id} was constructed with negative capacity`)
    }
    if (maxItems < 0) {
      throw new Error(`Bin ${id} was constructed with negative maxItems`)
    }
    if (displayMaxItems < maxItems) {
      throw new Error(`Bin ${id} was constructed with displayMaxItems ${displayMaxItems} < `
          +`maxItems ${maxItems}`)
    }
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

  get minItemSize(): number {
    return this._items[0].size
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

  moveOutItem(item: Item, target: Bin | null, stage: string, modifyCurrent?: boolean,
      moveCallback?: MoveCallback): void {
    return this.moveOut(
        this._items.findIndex(otherItem => item.id == otherItem.id),
        target,
        stage,
        modifyCurrent,
        moveCallback,
        item.id)
  }

  /** Removes the item at itemIndex. Adds it to the target bin if target is non-null. */
  moveOut(
      itemIndex: number,
      target: Bin | null,
      stage: string,
      modifyCurrent?: boolean,
      moveCallback?: MoveCallback,
      itemId?: string): void {
    const action = 'moveOut'
    const item = this.remove(itemIndex, stage, action, modifyCurrent, itemId)
    if (target !== null) {
      if (this.id === target.id) {
        throw new Error(`Algorithm error: Trying to move item ${item.id} 'out' from bin `+
            `${this.id} to itself during stage ${stage}, action ${action}`)
      }
      target.addNonMove(item)
    }
    if (moveCallback !== undefined) {
      moveCallback(item.id, this.id, target ? target.id : null, stage, action)
    }
  }

  /**
   * Moves item into this bin. Does not remove the item from its current bin, hence either only call
   * on items not in a known bin, or ensure removal is executed separately.
   */
  moveIn(item: Item, stage: string, action?: string, fromBin?: Bin, moveCallback?: MoveCallback)
      : void {
    const acton = action === undefined ? 'moveIn' : action
    if (fromBin !== undefined &&
        item.currentBinId !== undefined &&
        fromBin.id !== item.currentBinId) {
      throw new Error(`Algorithm error: moveIn fromBin ${fromBin.id} not the same as item `+
          `currentBinId ${item.currentBinId} during action ${action}, stage ${stage}, action `+
          action)
    }
    // Calculate priorBinId prior to moveing item! (May not end up getting used.)
    const priorBinId = fromBin !== undefined ?
        fromBin.id :
        (item.currentBinId !== undefined ? item.currentBinId : null)
    if (this._items.includes(item)) {
      throw new Error(`Algorithm error: Trying to move item ${item.id} 'in' from bin ${this.id} `+
          `to itself during stage ${stage}, action ${action}`)
    }
    this.addNonMove(item)
    if (moveCallback !== undefined) {
      moveCallback(item.id, priorBinId, this.id, stage, acton)
    }
  }

  static swap(
      binPair: SwapPair<Bin>,
      itemIndexPair: SwapPair<number>,
      stage: string,
      moveCallback?: MoveCallback): void {
    const action = 'swap'
    if (binPair.from.id === binPair.to.id) {
      throw new Error(`Algorithm error: Trying to swap items between bin ${binPair.from.id} and `+
          `itself during stage ${stage}, action ${action}`)
    }
    const fromItem = binPair.from.remove(itemIndexPair.from, stage, action, true)
    const toItem = binPair.to.remove(itemIndexPair.to, stage, action, true)
    binPair.from.moveIn(toItem, stage, action, binPair.to, moveCallback)
    binPair.to.moveIn(fromItem, stage, action, binPair.from, moveCallback)
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
   * Executes the move.
   * Throws if it is a move to and from the same bin.
   */
  static executeMove(move: Move, stage: string, moveCallback?: MoveCallback): void {
    if (move.from.id === move.to.id) {
      throw new Error(`Trying to execute move ${move.id} of item ${move.item.id} from bin `+
          `${move.from.id} to itself during stage ${stage}, action executeMove`)
    }
    move.from.moveOutItem(move.item, move.to, stage, true, moveCallback)
  }

  /**
   * Returns the index and size of the smallest item smaller or equal to max that is larger than the
   * bin's overutilization. If no element is large enough to cover the overutilization, the largest
   * possible item is removed. Returns a tuple of nulls if all items are larger than max.
   * May only be called on non-empty bins that are filled beyond capacity.
   */
  largestFromOverfill(max: number): { index: number, size: number } | null {
    if (this.itemCount === 0) {
      throw new Error(`Bin ${this.id} is empty, no items in overfill`)
    }
    if (!this.isOverfull()) {
      throw new Error(`Bin ${this.id} is not over capacity, no items in overfill`)
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

  private remove(
      index: number, stage: string, action?: string, modifyCurrent?: boolean, itemId?: string)
      : Item {
    if (index < 0 || this._items.length - 1 < index) {
      throw new Error(`Invalid index ${index} for item ${itemId} from array of length `+
          `${this._items.length} from bin ${this.id} during stage ${stage}, action ${action}`)
    }
    const removed = this._items.splice(index, 1)[0]
    this._fill -= removed.size
    if (modifyCurrent) {
      removed.currentBinId = undefined
    }
    return removed
  }

  isOpen(): boolean {
    return this.freeSlots > 0 && this.freeSpace > 0
  }

  /** Whether the bin is filled beyond capacity. */
  isOverfull(): boolean {
    return this.capacity < this.fill
  }

  /** Whether the bin contains more than maxItems. */
  isOverslots(): boolean {
    return this.maxItems < this.itemCount
  }

  /** Whether the bin is either filled beyond capacity or contains more than maxItems. */
  private isOverutilized(): boolean {
    return this.isOverslots() || this.isOverfull()
  }

  deepClone(): Bin {
    const cloned = new Bin(this.id, this.capacity, this.maxItems, this.displayMaxItems)
    this._items.forEach(item => cloned.addNonMove(item.deepClone()))
    return cloned
  }

  static capacityOf(bins: readonly Bin[]): number {
    return bins.reduce((acc: number, bin: Bin) => acc + bin.capacity, 0)
  }

  static totalSlots(bins: readonly Bin[]): number {
    return bins.reduce((acc: number, bin: Bin) => acc + bin.maxItems, 0)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  toJSON(_key: string): any {
    return {
      'ID': this.id,
      'capacity': this.capacity,
      'maxItems': this.displayMaxItems,
      'targetMaxItems': this.maxItems,
      'fill': this.fill,
      'itemCount': this.itemCount,
      'status': this.isOverutilized() ? 'overutilized' : (this.isOpen() ? 'open' : 'full'),
      'freeSlots': this.displayMaxItems - this.itemCount,
      'freeSpace': this.freeSpace,
      'smallestItemSize': this.itemCount === 0 ? 'n/a' : this.minItemSize,
      'largestItemSize': this.itemCount === 0 ? 'n/a' : this._items[this.itemCount - 1].size,
      'items': this._items.map(item => item.id)
    }
  }

  toString(): string {
    return JSON.stringify(this)
  }
}
