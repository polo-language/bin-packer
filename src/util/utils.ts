/** Sorts descending in-place. Returns the array argument for convenience. */
export function sortDescending<T>(array: T[], sizeOf: ((t: T) => number)): T[] {
  return array.sort((left, right) => sizeOf(right) - sizeOf(left))
}

/** Sorts ascending in-place. Returns the array argument for convenience. */
export function sortAscending<T>(array: T[], sizeOf: ((t: T) => number)): T[] {
  return array.sort((left, right) => sizeOf(left) - sizeOf(right))
}

export function sum<T>(array: readonly T[], sizeOf: ((t: T) => number)): number {
  return array.reduce((acc, cur) => acc += sizeOf(cur), 0)
}

/**
 * Adds array elements to the array in the tuple's first index if they fail the boolean test, adds
 * them to the second index if they pass.
 */
export function groupByBoolean<T>(array: readonly T[], predicate: (t: T) => boolean): [T[], T[]] {
  return array.reduce((acc: [T[], T[]], t: T) => {
    acc[boolToInt(predicate(t))].push(t)
    return acc
  }, [[], []])
}

/**
 * Maps false => 0, true => 1.
 */
function boolToInt(bool: boolean) {
  return bool ? 1 : 0
}

export function pushFrom<T>(index: number, from: T[], to: T[]) {
  to.push(from.splice(index, 1)[0])
}
