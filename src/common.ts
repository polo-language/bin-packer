export class Item {
  constructor(
      readonly id: string,
      readonly size: number,
      readonly originalBinId?: string
  ) { }
}

export class Bin {
  items: Item[]
  utilization: number

  constructor(
      readonly id: string,
      readonly capacity: number,
      readonly maxItems: number) {
    this.items = []
    this.utilization = 0
  }

  get itemCount() {
    return this.items.length
  }

  get freeSpace() {
    return this.capacity - this.utilization
  }

  add(item: Item) {
    this.items.push(item)
    this.utilization += item.size
  }

  hasOpening(): boolean {
    return this.itemCount < this.maxItems
  }
}

export type PackAdditionalItems = (
  bins: Bin[],
  itemsToMove: Item[]
) => Bin[]
