import { Bin } from '../repack/bin'
import { Item } from '../repack/item'

export class Move {
  constructor(readonly id: string, readonly item: Item, readonly from: Bin, readonly to: Bin) { }

  deepCopy(getBin: (binId: string) => Bin | undefined): Move {
    const fromCopy = getBin(this.from.id)
    if (fromCopy === undefined) {
      throw new Error(`Unable to find move 'from' bin with ID ${this.from.id}`)
    }
    const toCopy = getBin(this.to.id)
    if (toCopy === undefined) {
      throw new Error(`Unable to find move 'to' bin with ID ${this.to.id}`)
    }
    const itemCopy = fromCopy.items.find(it => it.id === this.item.id)
    if (itemCopy === undefined) {
      throw new Error(`Unable to find item with ID ${this.item.id} in bin ${fromCopy.id}`+
          ` ${fromCopy.items.map(it => it.id).join()}`)
    }
    return new Move(this.id, itemCopy, fromCopy, toCopy)
  }
}

export class BinMoves {
  constructor(
      public readonly bin: Bin,
      public readonly outgoing: Move[],
      public readonly incoming: Move[]) { }
}
