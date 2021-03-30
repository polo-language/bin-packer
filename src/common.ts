export interface Item {
  id: string
  size: number
  wasMoved(): boolean
}

export class Bin {
  readonly id: number
  readonly capacity: number
  readonly maxItems: number
  items: Item[]
  utilization: number

  constructor(id: number, capacity: number, maxItems: number) {
    this.id = id
    this.capacity = capacity
    this.maxItems = maxItems
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
