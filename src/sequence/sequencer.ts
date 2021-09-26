import { Bin, MoveCallback } from '../index'
import { getOrCreate, getOrNew } from '../util/utils'
import { BinMoves, Move } from './move'

/**
 * Generates a sequence of moves equivalent to the provided moves argument (meaning the result of
 * applying either of the input or output Move arrays to the bins argument results in identical
 * bins) that, when applied one-by-one, never violates a Bin invariant.
 * Checks slot invariants only, ignoring size invariants.
 * Consumes the moves argument. If not all moves can be sequenced, the remaining moves are left in
 * this array. Hence this argument should be checked to be empty after sequence returns.
 */
export function sequence(bins: readonly Bin[], moves: Move[], moveCallback?: MoveCallback): Move[] {
  const binMoves = prevalidate(assignMoves(bins, moves))
  const sequencedMoves: Move[] = []
  prelude(bins, binMoves, moves, sequencedMoves, moveCallback)
  executeArbitrary(binMoves, moves, sequencedMoves, moveCallback)
  return sequencedMoves
}

function prevalidate(binMoves: Map<string, BinMoves>): Map<string, BinMoves> {
  const slotFails = [...binMoves.entries()].filter(entry => slotFailPredicate(entry[1]))
  if (0 < slotFails.length) {
    throw new Error(`There are ${slotFails.length} bins for which there are more incoming items `+
        `than free slots and outgoing items. They are: ${slotFails.map(entry => entry[0])}`)
  }
  return binMoves
}

/**
 * Recursively executes all moves into bins that have no outgoing moves. Since there are no out
 * moves for the target bins of such moves, the incoming moves must all fit, and may freely be taken
 * prior to any other remaining moves. Assumes it has already been checked that there is no bin that
 * will be overfilled by the net in/out moves and current items.
 *
 * An incoming move for one bin is an outgoing move for another. After a move is executed,
 * the bin for which it was outgoing may no longer have any (remaining) outgoing moves,
 * hence iteration may discover new bins whose incoming moves may then be freely executed.
 *
 * Modifies bin contents and both move arrays.
 */
function prelude(
    bins: readonly Bin[],
    binMoves: Map<string, BinMoves>,
    remainingMoves: Move[],
    sequencedMoves: Move[],
    moveCallback?: MoveCallback) {
  const inNoOut = [...binMoves.values()].filter(binMoves =>
      0 < binMoves.incoming.length && 0 === binMoves.outgoing.length)
  if (0 === inNoOut.length) {
    return
  } else {
    // Execute moves on bins.
    for (const binMove of inNoOut) {
      // Copy array since it will be modified in execute.
      for (const move of [...binMove.incoming]) {
        execute(move, binMoves, remainingMoves, sequencedMoves, 'sequencer_prelude', moveCallback)
      }
    }
    prelude(bins, binMoves, remainingMoves, sequencedMoves, moveCallback)
  }
}

/**
 * Collects to/from moves relating to each group.
 * Assumes all moves are to and from one of the provided groups.
 * Assumes no move is from a group to itself.
 */
function assignMovesAllBins(bins: readonly Bin[], moves: readonly Move[]): Map<string, BinMoves> {
  const movesFromGroup = moves.reduce((acc, move) => {
    getOrCreate(acc, move.from.id, () => []).push(move)
    return acc
  }, new Map<string, Move[]>())
  const movesToGroup = moves.reduce((acc, move) => {
    getOrCreate(acc, move.to.id, () => []).push(move)
    return acc
  }, new Map<string, Move[]>())
  return new Map(bins.map(bin => [bin.id, new BinMoves(
      bin,
      getOrNew(movesFromGroup, bin.id, () => []),
      getOrNew(movesToGroup, bin.id, () => [])
  )]))
}

/**
 * Returns BinMoves for all bins that are involved in at least one move.
 */
function assignMoves(bins: readonly Bin[], moves: readonly Move[]): Map<string, BinMoves> {
  const binMoves = assignMovesAllBins(bins, moves)
  for (const entry of binMoves.entries()) {
    if (0 === entry[1].incoming.length && 0 === entry[1].outgoing.length) {
      binMoves.delete(entry[0])
    }
  }
  return binMoves
}

function execute(
    move: Move,
    binMoves: Map<string, BinMoves>,
    remainingMoves: Move[],
    sequencedMoves: Move[],
    stage: string,
    moveCallback?: MoveCallback): void {
  if (move.from.id === move.to.id) {
    throw new Error(`Algorithm error: move from and to the same bin ${move.from.id}`)
  }
  Bin.executeMove(move, stage, moveCallback)
  spliceOne(remainingMoves, sequencedMoves, move)
  // Update 'from' bin.
  const fromBinMove = binMoves.get(move.from.id)
  if (fromBinMove === undefined) {
    throw new Error(`Bin ${move.from.id} does not have any remaining associated moves. Expected `+
        `as 'from' bin for move ${move.id}`)
  }
  const fromMoveIndex = fromBinMove.outgoing.findIndex(outMove => move.id === outMove.id)
  if (fromMoveIndex  < 0) {
    throw new Error(`Move ${move.id} expected to still be unexecuted from bin ${move.from.id}`)
  }
  fromBinMove.outgoing.splice(fromMoveIndex, 1)
  if (fromBinMove.outgoing.length < 1 && fromBinMove.incoming.length < 1) {
    binMoves.delete(move.from.id)
  }
  // Update 'to' bin.
  const toBinMove = binMoves.get(move.to.id)
  if (toBinMove === undefined) {
    throw new Error(`Bin ${move.to.id} does not have any remaining associated moves. Expected `+
        `as 'to' bin for move ${move.id}`)
  }
  const toMoveIndex = toBinMove.incoming.findIndex(outMove => move.id === outMove.id)
  if (toMoveIndex < 0) {
    throw new Error(`Move ${move.id} expected to still be unexecuted to bin ${move.to.id}`)
  }
  toBinMove.incoming.splice(toMoveIndex, 1)
  if (toBinMove.outgoing.length < 1 && toBinMove.incoming.length < 1) {
    binMoves.delete(move.to.id)
  }
}

function slotFailPredicate(binMoves: BinMoves): boolean {
  return binMoves.bin.freeSlots + binMoves.outgoing.length < binMoves.incoming.length
}

function splice(from: Move[], to: Move[], fromSubset: Move[]) {
  for (const move of fromSubset) {
    spliceOne(from, to, move)
  }
}

function spliceOne(from: Move[], to: Move[], fromMove: Move) {
  const index = from.findIndex(move => fromMove.id === move.id)
  if (index === -1) {
    throw new Error(`Move with ID ${fromMove.id} not in 'from'`)
  }
  to.push(from.splice(index, 1)[0])
}

/**
 * While there exists a move whose target has an open slot.
 * Arbitrarily select and execute such a move (order may matter but stage1 just tries its luck).
 * Worst case time is O(n^2) in the number of remaining moves.
 */
function executeArbitrary(
    binMoves: Map<string, BinMoves>,
    remainingMoves: Move[],
    sequencedMoves: Move[],
    moveCallback?: MoveCallback) {
  let moveMade
  do {
    moveMade = false
    for (const move of remainingMoves) {
      if (0 < move.to.freeSlots) {
        execute(
            move,
            binMoves,
            remainingMoves,
            sequencedMoves,
            'sequencer_executeArbitrary',
            moveCallback)
        moveMade = true
        // Start over so we don't modify remainingMoves during iteration.
        // Can't mark moves here and process after inner loop since one move may fill a space
        // required for another move.
        break
      }
    }
  } while (moveMade)
}
