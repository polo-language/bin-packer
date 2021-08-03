import { Bin } from '../repack/bin'
import { Item } from '../repack/item'

export class Move {
  constructor(readonly id: string, readonly item: Item, readonly from: Bin, readonly to: Bin) { }
}

export class BinMoves {
  constructor(
      public readonly bin: Bin,
      public readonly outgoing: Move[],
      public readonly incoming: Move[]) { }
}
