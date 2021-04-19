export interface PackingOutput<T> {
    bins: T[][]
    oversized: T[]
}

export interface BoundOutput {
    bound: number
    oversized: number
}

export type InputObject<T> =
    T[] |
    Iterable<T> |
    { [index: string]: T }

export type PackingFunction<T> = (
    obj:  InputObject<T>,
    sizeOf: (item: T) => number,
    capacity: number
) => PackingOutput<T>

export type BoundFunction<T> = (
    obj: InputObject<T>,
    sizeOf: (item: T) => number,
    capacity: number
    ) => BoundOutput
    
export { nextFit, firstFit, firstFitDecreasing, bestFitDecreasing } from './pack/fit-algos'
export { binCompletion } from './pack/bin-completion'
export { lowerBound1, lowerBound2 } from './pack/bounds'
    