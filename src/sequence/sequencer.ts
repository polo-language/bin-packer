import { Bin } from '../repack/bin'
import { MoveCallback } from '../index'
import { getOrCreate, getOrNew, groupByBoolean } from '../util/utils'
import { BinMoves, Move } from './move'

/**
 * Generates a sequence of moves equivalent to the provided moves argument (meaning the result of
 * applying either of the input or output Move arrays to the bins argument results in identical
 * bins) that, when applied one-by-one, never violates a Bin invariant.
 * Checks slot invariants only, ignoring size invariants.
 * May not be able to sequence all moves (e.g. due to a cycle).
 * Returns a tuple of Move arrays of the form [sequenced, unsequenced].
 */
export function sequence(bins: readonly Bin[], moves: readonly Move[], moveCallback?: MoveCallback)
    : [Move[], Move[]] {
  const copies1 = copyInputs(bins, moves)
  const [binMoves1, remainingMoves1, sequencedMoves1] =
      prelude(copies1[0], copies1[1], true, moveCallback)
  executeArbitrary(binMoves1, remainingMoves1, sequencedMoves1, moveCallback)
  if (0 === remainingMoves1.length) {
    return [
        Move.setOrder(mapToOriginals(moves, sequencedMoves1)),
        mapToOriginals(moves, remainingMoves1)]
  } else {
    // Start over and try to execute these moves first. Then proceed with executeArbitrary.
    const copies2 = copyInputs(bins, moves)
    const [binMoves2, remainingMoves2All, sequencedMoves2] =
        prelude(copies2[0], copies2[1], false, moveCallback)
    const remainingMoves1Ids = new Set(remainingMoves1.map(move => move.id))
    const [remainingMoves2, firstRoundFails2] =
        groupByBoolean(remainingMoves2All, move => remainingMoves1Ids.has(move.id))
    executeArbitrary(binMoves2, firstRoundFails2, sequencedMoves2, moveCallback)
    if (0 < firstRoundFails2.length) {
      Array.prototype.push.apply(remainingMoves2, firstRoundFails2)
    }
    executeArbitrary(binMoves2, remainingMoves2, sequencedMoves2, moveCallback)
    return [
        Move.setOrder(mapToOriginals(moves, sequencedMoves2)),
        mapToOriginals(moves, remainingMoves2)]
  }
}

function mapToOriginals(moves: readonly Move[], copyMoves: Move[]): Move[] {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return copyMoves.map(copy => moves.find(m => m.id === copy.id)!)
}

/**
 * Genertes a map of BinMoves from a new copy of bins.
 * Executes only moves that are known to be safe.
 */
function prelude(
    bins: readonly Bin[],
    moves: Move[],
    shouldValidate: boolean,
    moveCallback?: MoveCallback)
    : [Map<string, BinMoves>, Move[], Move[]] {
  const binMoves = assignMoves(bins, moves)
  if (shouldValidate) {
    prevalidate(binMoves)
  }
  const sequencedMoves: Move[] = []
  executeInNoOut(binMoves, moves, sequencedMoves, moveCallback)
  return [binMoves, moves, sequencedMoves]
}

function copyInputs(bins: readonly Bin[], moves: readonly Move[]): [Bin[], Move[]] {
  const binsCopy = bins.map(bin => bin.deepClone())
  const binMap = new Map<string, Bin>(binsCopy.map(bin => [bin.id, bin]))
  return [binsCopy, moves.map(move => move.deepCopy(Map.prototype.get.bind(binMap)))]
}

function prevalidate(binMoves: Map<string, BinMoves>): void {
  const slotFails = [...binMoves.entries()].filter(entry => slotFailPredicate(entry[1]))
  if (0 < slotFails.length) {
    throw new Error(`There are ${slotFails.length} bins for which there are more incoming items `+
        `than free slots and outgoing items. They are: ${slotFails.map(entry => entry[0])}`)
  }
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
function executeInNoOut(
    binMoves: Map<string, BinMoves>,
    remainingMoves: Move[],
    sequencedMoves: Move[],
    moveCallback?: MoveCallback) {
  const inNoOutBinMoves = [...binMoves.values()].filter(binMoves =>
      0 < binMoves.incoming.length && 0 === binMoves.outgoing.length)
  if (0 === inNoOutBinMoves.length) {
    return
  } else {
    // Execute moves on bins.
    for (const binMove of inNoOutBinMoves) {
      // Copy array since it will be modified in execute.
      for (const move of [...binMove.incoming]) {
        execute(move, binMoves, remainingMoves, sequencedMoves, 'sequencer_prelude', moveCallback)
      }
    }
    executeInNoOut(binMoves, remainingMoves, sequencedMoves, moveCallback)
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

function spliceOne(from: Move[], to: Move[], fromMove: Move) {
  const index = from.findIndex(move => fromMove.id === move.id)
  if (index === -1) {
    throw new Error(`Move with ID ${fromMove.id} not in 'from'`)
  }
  to.push(from.splice(index, 1)[0])
}

/**
 * While there exists a move whose target has an open slot.
 * Arbitrarily select and execute such a move (order may matter but here it just tries its luck).
 * Worst case time is O(n^2) in the number of remaining moves.
 * Returns whether or not it made any moves.
 */
function executeArbitrary(
    binMoves: Map<string, BinMoves>,
    remainingMoves: Move[],
    sequencedMoves: Move[],
    moveCallback?: MoveCallback): boolean {
  let everMoveMade = false
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
        everMoveMade = true
        // Start over so we don't modify remainingMoves during iteration.
        // Can't mark moves here and process after inner loop since one move may fill a space
        // required for another move.
        break
      }
    }
  } while (moveMade)
  return everMoveMade
}
