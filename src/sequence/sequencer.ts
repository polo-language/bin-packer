import { Bin, MoveCallback } from '../index'
import { getOrCreate, getOrNew } from '../util/utils'
import { BinMoves, Move } from './move'

/**
 * Generates a sequence of moves equivalent to the provided moves argument (meaning the result of
 * applying either of the input or output Move arrays to the bins argument results in identical
 * bins) that, when applied one-by-one, never violates a Bin invariant.
 * Currently checks slot invariants only, ignoring size invariants.
 */
export function sequence(bins: Bin[], moves: Move[], moveCallback: MoveCallback): Move[] {
  const sequencedMoves: Move[] = []
  prelude(bins, moves, sequencedMoves, moveCallback)
  stage1(moves, sequencedMoves, moveCallback)
  return sequencedMoves
}

/**
 * Recursive.
 * Modifies bin contents and move arrays.
 * Returns sequenced moves.
 */
function prelude(
    bins: readonly Bin[],
    remainingMoves: Move[],
    sequencedMoves: Move[],
    moveCallback: MoveCallback) {
  const binMovesAll = assignMoves(bins, remainingMoves)
  const slotFails = binMovesAll.filter(binMove => slotFailPredicate(binMove))
  if (0 < slotFails.length) {
    throw new Error(`There are ${slotFails.length} bins for which there are more incoming items `+
        `than free slots and/or outgoing items. They are: ${slotFails.map(bM => bM.bin.id)}`)
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
      for (const incoming of binMove.incoming) {
        binMove.bin.executeMove(incoming, moveCallback, 'sequencer_prelude')
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

function stage1(
    remainingMoves: Move[],
    sequencedMoves: Move[],
    moveCallback: MoveCallback) {
  let moveMade
  do {
    moveMade = false
    for (const move of remainingMoves) {
      if (0 < move.to.freeSlots) {
        moveMade = true
        move.from.executeMove(move, moveCallback, 'sequencer_stage1')
        spliceOne(remainingMoves, sequencedMoves, move)
      }
    }
  } while (moveMade)
}
