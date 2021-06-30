import { InputObject, PackingOutput } from '../index';
import { prepareValues } from '../util/prepare-values';
import { sortDescending, sum } from '../util/utils';
import { lowerBound2Sorted } from './bounds'
import { bestFitDecreasingSorted } from './fit-algos'

class CompletionNode<T> {
  accumulatedWaste: number

  constructor(
      public bin: T[],
      size: number,
      public depth: number,
      public parent: CompletionNode<T> | null,
      parentWaste: number,
      public tail: T[],
      public tailSum: number,
      public capacity: number) {
    this.accumulatedWaste = parentWaste + capacity - size
  }

  completionChildFrom(feasibleSet: FeasibleSet<T>): CompletionNode<T> {
    const childBin: T[] = []
    const childTail: T[] = []
    for (let i = 0; i < feasibleSet.tailStartIndex; ++i) {
      if (feasibleSet.includedIndexes[i] !== undefined) {
        childBin.push(feasibleSet.array[i])
      } else {
        childTail.push(feasibleSet.array[i])
      }
    }
    return new CompletionNode(
        childBin,
        feasibleSet.includedSum,
        this.depth + 1,
        this,
        this.accumulatedWaste,
        childTail.concat(feasibleSet.array.slice(
            feasibleSet.tailStartIndex,
            feasibleSet.array.length)),
        feasibleSet.tailSum,
        this.capacity)
  }

  /** Walks up the tree, assembling itself and its parents into an array. */
  assemblePacking(): T[][] {
    const packing: T[][] = []
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node: CompletionNode<T> = this
    while (node.parent !== null) {
        packing.push(node.bin)
        node = node.parent
    }
    return packing.reverse()
  }
}

class FeasibleSet<T> {
  constructor(
      readonly array: T[],
      public includedIndexes: number[],     // Sparse array: value set at included indexes.
      public includedSum: number,
      public numIncludedIndexes: number,    // Number of values set in includedIndexes
      public tailStartIndex: number,
      public tailSum: number) {
  }

  /* private */
  // May produce a non-feasible FeasibleSet (size larger than capacity) if
  // includeTailStart === true.
  makeChildIncluding(sizeOf: (t: T) => number, nextIncludedIndex: number): FeasibleSet<T> {
    if (nextIncludedIndex < this.tailStartIndex ||
      this.array.length <= nextIncludedIndex) {
      throw new Error('Can only include an element from the tail when creating '+
          ' a new child')
    }
    const childIncludeIndexes = this.includedIndexes.slice()
    childIncludeIndexes[nextIncludedIndex] = nextIncludedIndex
    const elementSize = sizeOf(this.array[nextIncludedIndex])
    return new FeasibleSet<T>(
      this.array,
      childIncludeIndexes,
      this.includedSum + elementSize,
      this.numIncludedIndexes + 1,
      nextIncludedIndex + 1,
      this.tailSum - elementSize)
  }

  makeChildNotIncluding(nextTailStartIndex: number): FeasibleSet<T> {
    if (nextTailStartIndex < this.tailStartIndex ||
        this.array.length < nextTailStartIndex) {
      // May equal tailStartIndex when the tail has been exhausted.
      throw new Error('Can not advance the tail past its length')
    }
    return new FeasibleSet(
      this.array,
      this.includedIndexes.slice(),
      this.includedSum,
      this.numIncludedIndexes,
      nextTailStartIndex,
      this.tailSum)
  }

  /**
   * Returns the next pair of children with an included and an excluded element.
   * Children that don't include an element are only useful in generating
   * later children that do include elements. So instead of recursing over a 
   * tree descending exclusively to the right, just cut strait to the next pair
   * where there is a choice between including and excluding a given element.
   * Any elements in the current tail up until that element will be excluded
   * from both children. If the tail is exhausted without finding an element
   * that can be included, then returns a single right child with the same
   * included elements as this, but with an empty tail.
   */
  makeFeasibleChildren(sizeOf: (t: T) => number, capacity: number): FeasibleSet<T>[] {
    const children: FeasibleSet<T>[] = []
    let index = this.tailStartIndex
    while (index < this.array.length) {
      const elementSize = sizeOf(this.array[index])
      if (this.includedSum + elementSize <= capacity) {
        children.push(this.makeChildIncluding(sizeOf, index))
        break
      }
      ++index
    }
    // If the final element of the tail allows for a pair, then don't return the
    // exluded child. That completion can't be as good as the one including the
    // final element since there are no more elements to add.
    if (index >= this.array.length - 1) {
      if (children.length === 0) {
        // Got to the end of the array without being able to add another item.
        children.push(this.makeChildNotIncluding(this.array.length))
      }
      // Else added the final element of the tail. Don't add unincluded child.
    } else {
      // Added some non-final element.
      children.push(this.makeChildNotIncluding(index + 1))
    }
    return children
  }
}

class SolutionState<T> {
  maxWaste: number

  constructor(
      readonly lowerBound: number,
      readonly totalSize: number,
      readonly capacity: number,
      public bestSolution: T[][]) {
    this.maxWaste = this.getMaxWaste()
  }

  get bestLength(): number {
    return this.bestSolution.length
  }

  updateBestSolution(newBestSolution: T[][]) {
    this.bestSolution = newBestSolution
    this.maxWaste = this.getMaxWaste()
  }

  /* private */
  getMaxWaste(): number {
    return (this.bestLength - 1) * this.capacity - this.totalSize
  }

  minCompletionSum(accumulatedWaste: number): number {
    return this.capacity - (this.maxWaste - accumulatedWaste)
  }
}

export function binCompletion<T>(
    obj: InputObject<T>,
    sizeOf: (t: T) => number,
    capacity: number)
        : PackingOutput<T> {
  const {array: array, oversized: oversized} = prepareValues(obj, sizeOf, capacity)
  const descending = sortDescending(array, sizeOf)
  const lowerBound = lowerBound2Sorted(descending.slice().reverse(), sizeOf, capacity)
  const bestSolution = bestFitDecreasingSorted(descending, sizeOf, capacity)
  if (lowerBound === bestSolution.length) {
    return {
      'bins': bestSolution,
      'oversized': oversized,
    }
  } else {
    const totalSize = sum(descending, sizeOf)
    const solutionState = new SolutionState(lowerBound, totalSize, capacity, bestSolution)
    const lowerBoundSolution = nextCompletionLevel(
              new CompletionNode([], capacity, 0, null, 0, descending, totalSize, capacity),
              solutionState,
              sizeOf)
    return {
      'bins': lowerBoundSolution || solutionState.bestSolution,
      'oversized': oversized,
    }
  }
}

function nextCompletionLevel<T>(
    completionNode: CompletionNode<T>,
    solutionState: SolutionState<T>,
    sizeOf: (t: T) => number)
        : T[][] | null {
  const nextDepth = completionNode.depth + 1
  for (const feasibleSet of generateFeasibleSets(completionNode, solutionState, sizeOf)) {
    if (feasibleSet.numIncludedIndexes === feasibleSet.array.length) {
      // All elements have been binned.
      if (nextDepth === solutionState.lowerBound) {
        // Unbeatable solution.
        return completionNode.completionChildFrom(feasibleSet).assemblePacking()
      } else {
        // Store the new best solution. Will only have recursed to here if the
        // bin chain was shorter than the previous best.
        solutionState.updateBestSolution(
            completionNode.completionChildFrom(feasibleSet).assemblePacking())
      }
    } else {
      // Haven't used up all the elements yet. So recurse if, with one more bin, 
      // this chain will still be shorter than the current best solution.
      if (nextDepth + 1 < solutionState.bestLength) {
        const lowerBoundSolution = nextCompletionLevel(
            completionNode.completionChildFrom(feasibleSet),
            solutionState,
            sizeOf)
        if (lowerBoundSolution !== null) {
          // Forward the solution up the stack. No need to continue.
          return lowerBoundSolution
        }
      }
    }
  }
  // The best solution found so far has been stored in solutionState.
  return null
}

function generateFeasibleSets<T>(
    completionNode: CompletionNode<T>,
    solutionState: SolutionState<T>,
    sizeOf: (t: T) => number)
        : FeasibleSet<T>[] {
  // Individual elements are all assumed smaller than capacity, so no need to
  // check for a bin containing a single element.
  const largestElementSize = sizeOf(completionNode.tail[0])
  return recurseFeasibleSets(
      new FeasibleSet(
          completionNode.tail,
          [0,], // Always include the largest element.
          largestElementSize,
          1,
          1,
          completionNode.tailSum - largestElementSize),
      sizeOf,
      solutionState.capacity,
      solutionState.minCompletionSum(completionNode.accumulatedWaste))
}

/**
 * Generates all feasible sets containing this set's elements and any smaller
 * elements. Assumes {@link feasibleSet}'s size is less than capacity (i.e. is
 * truly a feasible set).
 */
function recurseFeasibleSets<T>(
    feasibleSet: FeasibleSet<T>,
    sizeOf: (t: T) => number,
    capacity: number,
    minCompletionSum: number)
        : FeasibleSet<T>[] {
  if (feasibleSet.includedSum === capacity) {
    // Already full.
    return [feasibleSet,]
  } else if (feasibleSet.tailStartIndex >= feasibleSet.array.length) {
    // Leaf node, check if it's too wasteful to be a completion.
    if (feasibleSet.includedSum >= minCompletionSum) {
      return [feasibleSet,]
    } else {
      return []
    }
  } else if (feasibleSet.includedSum + feasibleSet.tailSum >= minCompletionSum) {
    // Return completions from our descendents.
    const children = feasibleSet.makeFeasibleChildren(sizeOf, capacity)
    const descendentSets = recurseFeasibleSets(
        children[0],
        sizeOf,
        capacity,
        minCompletionSum)
    if (children.length < 2) {
      return descendentSets
    } else {
      return descendentSets.concat(recurseFeasibleSets(
          children[1],
          sizeOf,
          capacity,
          minCompletionSum))
    }
  } else {
    // The tail is too small to form any completions from here.
    return []
  }
}
