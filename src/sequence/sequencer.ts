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
  const sequencedMoves: Move[] = []
  prelude(bins, moves, sequencedMoves, moveCallback)
  stage1(moves, sequencedMoves, moveCallback)
  return sequencedMoves
}

/**
 * Recursively executes all moves into bins that have no outgoing moves. Checks first that there is
 * no bin that will be overfilled by the net in/out moves and current items. Since there are no out
 * moves for the target bins of such moves, the incoming moves must all fit, and may freely be taken
 * prior to any other remaining moves.
 *
 * An incoming move for one bin is an outgoing move for another. After a move is executed,
 * the bin for which it was outgoing may no longer have any (remaining) outgoing moves,
 * hence iteration may discover new bins whose incoming moves may then be freely executed.
 *
 * Modifies bin contents and both move arrays.
 */
function prelude(
    bins: readonly Bin[],
    remainingMoves: Move[],
    sequencedMoves: Move[],
    moveCallback?: MoveCallback) {
  const binMovesAll = assignMoves(bins, remainingMoves)
  const slotFails = binMovesAll.filter(binMove => slotFailPredicate(binMove))
  if (0 < slotFails.length) {
    throw new Error(`There are ${slotFails.length} bins for which there are more incoming items `+
        `than free slots and outgoing items. They are: ${slotFails.map(bM => bM.bin.id)}`)
  }
  const binMoves = binMovesAll.filter(binsMoves =>
      0 !== binsMoves.incoming.length || 0 !== binsMoves.outgoing.length)
  const inNoOutBinMoves = binMoves.filter(binMoves =>
      0 < binMoves.incoming.length && 0 === binMoves.outgoing.length)
  if (0 === inNoOutBinMoves.length) {
    return
  } else {
    // Execute moves on bins.
    for (const binMove of inNoOutBinMoves) {
      for (const move of binMove.incoming) {
        Bin.executeMove(move, 'sequencer_prelude', moveCallback)
      }
    }
    const toExecute = inNoOutBinMoves.flatMap(binMoves => binMoves.incoming)
    splice(remainingMoves, sequencedMoves, toExecute)
    prelude(bins, remainingMoves, sequencedMoves, moveCallback)
  }
}

/**
 * Collects to/from moves relating to each group.
 * Assumes all moves are to and from one of the provided groups.
 * Assumes no move is from a group to itself.
 */
function assignMoves(bins: readonly Bin[], moves: readonly Move[]): BinMoves[] {
  const movesFromGroup = moves.reduce((acc, move) => {
    getOrCreate(acc, move.from.id, () => []).push(move)
    return acc
  }, new Map<string, Move[]>())
  const movesToGroup = moves.reduce((acc, move) => {
    getOrCreate(acc, move.to.id, () => []).push(move)
    return acc
  }, new Map<string, Move[]>())
  return bins.map(bin => new BinMoves(
      bin,
      getOrNew(movesFromGroup, bin.id, () => []),
      getOrNew(movesToGroup, bin.id, () => [])
  ))
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
function stage1(
    remainingMoves: Move[],
    sequencedMoves: Move[],
    moveCallback?: MoveCallback) {
  let moveMade
  do {
    moveMade = false
    for (const move of remainingMoves) {
      if (0 < move.to.freeSlots) {
        Bin.executeMove(move, 'sequencer_stage1', moveCallback)
        spliceOne(remainingMoves, sequencedMoves, move)
        moveMade = true
        // Start over so we don't modify remainingMoves during iteration.
        // Can't mark moves here and process after inner loop since one move may fill a space
        // required for another move.
        break
      }
    }
  } while (moveMade)
}
