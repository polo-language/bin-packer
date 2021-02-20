export interface PackingOutput<T> {
    bins: T[][]
    oversized: T[]
}

export interface BoundOutput {
    bound: number
    oversized: number
}

export interface InputObject<T> {
    [index: string]: T
}

export type PackingFunction<T> = (
    obj:  T[] | InputObject<T>,
    sizeOf: (item: T) => number,
    capacity: number
) => PackingOutput<T>

export function nextFit<T>(
    obj: T[] | InputObject<T>,
    sizeOf: (item: T) => number,
    capacity: number)
        : PackingOutput<T>

export function firstFit<T>(
    obj: T[] | InputObject<T>,
    sizeOf: (item: T) => number,
    capacity: number)
        : PackingOutput<T>

export function firstFitDecreasing<T>(
    obj: T[] | InputObject<T>,
    sizeOf: (item: T) => number,
    capacity: number)
        : PackingOutput<T>

export function bestFitDecreasing<T>(
    obj: T[] | InputObject<T>,
    sizeOf: (item: T) => number,
    capacity: number)
        : PackingOutput<T>

export function binCompletion<T>(
    obj: T[] | InputObject<T>,
    sizeOf: (item: T) => number,
    capacity: number)
        : PackingOutput<T>

export type BoundFunction<T> = (
    obj: T[] | InputObject<T>,
    sizeOf: (item: T) => number,
    capacity: number
) => BoundOutput

export function lowerBound1<T>(
    obj: T[] | InputObject<T>,
    sizeOf: (item: T) => number,
    capacity: number)
        : BoundOutput

export function lowerBound2<T>(
    obj: T[] | InputObject<T>,
    sizeOf: (item: T) => number,
    capacity: number)
        : BoundOutput
