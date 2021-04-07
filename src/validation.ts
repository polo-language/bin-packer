import { /*Item,*/ Bin, /*Move,*/ ChangeReport }  from './common'

/**
 * Throws if any items are missing/added between the two inputs.
 * Throws if any item still has an undefined newBinId.
 * Throws if any bins have been added or removed.
 * @param beforeBins 
 * @param afterBins 
 */
export function itemAccounting(beforeBins: Bin[], afterBins: Bin[]) {
  // TODO
}

/**
 * Throws if any bin invariants are violated.
 * @param bins 
 */
export function validateBins(bins: Bin[]) {
  // TODO
}

/**
 * Report all item moves.
 */
export function getChangeReport(bins: Bin[]): ChangeReport {
  // TODO
  return { moves: [] }
}
