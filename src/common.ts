export class Item {
  newBinId?: string

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

  get freeSlots() {
    return Math.max(0, this.maxItems - this.itemCount)
  }

  get overutilization() {
    return Math.min(0, -1 * this.freeSpace)
  }

  add(item: Item) {
    this.items.push(item)
    this.utilization += item.size
  }

  isOpen(): boolean {
    return this.freeSlots > 0 && this.freeSpace > 0
  }

  sortDescending(): Item[] {
    return this.items.sort((a, b) => b.size - a.size)
  }
}

export type RepackAlgorithm = (
  openBins: Bin[],
  overfullBins: Bin[],
  newItems: Item[]
) => Bin[]

export class Move {
  constructor(
    readonly item: Item,
    readonly fromBin: Bin | undefined,
    readonly toBin: Bin
  ) { }
}

export interface ChangeReport {
  moves: Move[]
}
