export class Item {
  // May only be modified by the add/remove methods of Bin.
  currentBinId?: string

  constructor(
      readonly id: string,
      readonly size: number,
      readonly originalBinId?: string) {
    if (size < 0) {
      throw new Error(`Item ${id} was constructed with negative size`)
    }
    this.currentBinId = originalBinId
  }

  deepClone(): Item {
    const cloned = new Item(this.id, this.size, this.originalBinId)
    cloned.currentBinId = this.currentBinId
    return cloned
  }

  hasMoved(): boolean {
    return this.originalBinId !== this.currentBinId
  }

  toString(): string {
    return `ID: ${this.id}, size: ${this.size}, fromBin: ${this.originalBinId}, `+
        `toBin: ${this.currentBinId}`
  }

  static sizeOf(items: readonly Item[]): number {
    return items.reduce((acc, item) => acc + item.size, 0)
  }
}
