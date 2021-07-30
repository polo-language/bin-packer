import { Bin, MoveCallback } from '../index'
import { getOrCreate, getOrNew } from '../util/utils'
import { BinMoves, Move } from './move'

/**
 * Generates a sequence of moves equivalent to the provided moves argument (meaning the result of
 * applying either of the input or output Move arrays to the bins argument results in identical
 * bins) that, when applied one-by-one, never violates a Bin invariant.
 * Currently checks slot invariants only, ignoring size invariants.
 */
export function sequence(bins: Bin[], moves: Move[]): Move[] {
  const moveCallback: MoveCallback = (_itemId, _fromBinId, _toBinId, _stage, _action) => {}
  return prelude(bins, moves, moveCallback, [])
}

/**
 * Recursive.
 * Modifies bin contents.
 */
function prelude(
    bins: readonly Bin[],
    remainingMoves: Move[],
    moveCallback: MoveCallback,
    sequencedMoves: Move[]): Move[] {
  const binMovesAll = assignMoves(bins, remainingMoves)
  const slotFails = binMovesAll.filter(binMove => slotFailPredicate(binMove))
  if (0 < slotFails.length) {
    throw new Error(`There are ${slotFails.length} bins for which there are more incoming items `+
        `than free slots and/or outgoing items. They are: ${slotFails.map(bM => bM.bin.id)}`)
  }
  const binMoves = binMovesAll.filter(binsMoves =>
      0 !== binsMoves.incoming.length || 0 !== binsMoves.outgoing.length)
  const actionableBinMoves = binMoves.filter(binMoves =>
      0 < binMoves.incoming.length && 0 === binMoves.outgoing.length)
  if (0 === actionableBinMoves.length) {
    return sequencedMoves
  } else {
    // Execute moves on bins.
    for (const actionable of actionableBinMoves) {
      for (const incoming of actionable.incoming) {
        actionable.bin.executeMove(incoming, moveCallback, 'prelude')
      }
    }
    const actionableMoves = actionableBinMoves.flatMap(binMoves => binMoves.incoming)
    const otherMoves = remainingMoves.filter(move => !actionableMoves.includes(move))
    for (const move of actionableMoves) {
      sequencedMoves.push(move)
    }
    return prelude(bins, otherMoves, moveCallback, sequencedMoves)
  }
}

function inNoOutBins(movesForBins: BinMoves[]): BinMoves[] {
  return movesForBins.filter(binMoves =>
      0 < binMoves.incoming.length && 0 === binMoves.outgoing.length)
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
