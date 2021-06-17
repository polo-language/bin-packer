export class SwapPair<T> {
  constructor(readonly from: T, readonly to: T) { }

  map<U>(f: (t: T) => U): SwapPair<U> {
    return new SwapPair(f(this.from), f(this.to))
  }
}

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

/**
 * Returns all items that appear more than once in array. An item appearing n times in the output
 * appears n + 1 times in the input.
 */
export function duplicates<T, H extends number | string>(array: readonly T[], hash: (t: T) => H)
    : T[] {
  const duplicates = Array.from(array)
  new Map<H, T>(array.map(t => [hash(t), t])).forEach((_t, h) => {
    duplicates.splice(duplicates.findIndex(dupT => h === hash(dupT)), 1)
  })
  return duplicates
}

export function missing<T, H extends number | string>(all: T[], subset: T[], hash: (t: T) => H)
    : T[] {
  const missing = Array.from(all)
  for (const t of subset) {
    missing.splice(missing.findIndex(other => hash(other) === hash(t)), 1)
  }
  return missing
}
