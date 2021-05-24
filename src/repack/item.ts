export class Item {
  // May only be modified by the add/remove methods of Bin.
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

  static sizeOf(items: readonly Item[]): number {
    return items.reduce((acc, item) => acc + item.size, 0)
  }
}
