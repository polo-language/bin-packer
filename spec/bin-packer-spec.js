'use strict'

const fs = require('fs')
    , binPacker = require('../lib/index')
    , utils = require('../lib/util/utils')

class AlgorithmType {
  static APPROX_PACKING = new AlgorithmType('APPROX_PACKING')
  static EXACT_PACKING = new AlgorithmType('EXACT_PACKING')
  static LOWER_BOUND = new AlgorithmType('LOWER_BOUND')

  constructor(name) {
    this.name = name
  }

  static isPacking(type) {
    return type === AlgorithmType.APPROX_PACKING ||
        type === AlgorithmType.EXACT_PACKING
  }
}

class Algorithm {
  /**
   * @param {string} name 
   * @param {function} method 
   * @param {AlgorithmType} type 
   */
  constructor(name, method, type) {
    this.name = name
    this.method = method
    this.type = type
  }
}

class DataSpec {
  constructor(name, data, sizeOf, capacity, optimalSize) {
    this.name = name
    this.data = data
    this.sizeOf = sizeOf
    this.capacity = capacity
    this.optimalSize = optimalSize
    this.dataArray = utils.toArray(this.data)
    this.dataLength = this.dataArray.length
    this.oversizedInData = anyTooBigInBin(this.dataArray, sizeOf, capacity)
  }
}

class PackedResult {
  /**
   * @param {Algorithm} algorithm
   * @param {DataSpec} dataSpec
   * @param {object} result  Altgorithm output.
   *    For fit algorithms: {bins: [], oversized: [],}
   *    For bound algorithms: {bound: <Number>, oversized: <Number>}
   */
  constructor(algorithm, dataSpec, result) {
    this.algorithm = algorithm
    this.dataSpec = dataSpec
    this.result = result
  }
}

const algorithms = [
        new Algorithm('nextFit', binPacker.nextFit, AlgorithmType.APPROX_PACKING),
        new Algorithm('firstFit', binPacker.firstFit, AlgorithmType.APPROX_PACKING),
        new Algorithm('firstFitDecreasing',
            binPacker.firstFitDecreasing, AlgorithmType.APPROX_PACKING),
        new Algorithm('bestFitDecreasing',
            binPacker.bestFitDecreasing, AlgorithmType.APPROX_PACKING),
        new Algorithm('binCompletion', binPacker.binCompletion, AlgorithmType.EXACT_PACKING),
        new Algorithm('lowerBound1', binPacker.lowerBound1, AlgorithmType.LOWER_BOUND),
        new Algorithm('lowerBound2', binPacker.lowerBound2, AlgorithmType.LOWER_BOUND),
        ]
    , itemIsSize = item => item
    , dataPath = './spec/data/Falkenauer_ordered.json'
    , dataSpecs = toDataSpecs(dataFileToJson(dataPath), itemIsSize)
    , specsToRun = 80 // Number.MAX_SAFE_INTEGER

function toDataSpecs(json, sizeOf) {
  return Object.values(json).map(data =>
    new DataSpec(data.name, data.data, sizeOf, data.capacity, data.solution)
  )
}

function dataFileToJson(path) {
  return JSON.parse(fs.readFileSync(path))
}

/**
 * @param {DataSpec} dataSpec 
 * @param {array<Algorithm>} algorithms 
 * @returns {array<PackedResult>}
 */
function allResultsFor(dataSpec, algorithms) {
  const results = []
  for (const algorithm of algorithms) {
    if (AlgorithmType.EXACT_PACKING !== algorithm.type || isSafeToRunExactAlgo(dataSpec)) {
      results.push(new PackedResult(
          algorithm,
          dataSpec,
          algorithm.method(dataSpec.data.slice(), dataSpec.sizeOf, dataSpec.capacity)))
    }
  }
  return results
}

function isSafeToRunExactAlgo(dataSpec) {
  if (dataSpec.data.length > 120) {
    return false
  }
  if (dataSpec.name.startsWith('Falkenauer_t')) {
    return false
  }
  return true
}

/**
 * @param {array<PackedResult>} allResults
 * @param {string} algorithmName
 */
function findResultFor(allResults, algorithmName) {
  return allResults.find(results => results.algorithm.name === algorithmName)
}

function anyTooBig(bins, sizeOf, capacity) {
  for (const bin of bins) {
    if (anyTooBigInBin(bin, sizeOf, capacity)) {
      return true
    }
  }
  return false
}

function anyTooBigInBin(bin, sizeOf, capacity) {
  for (const item of bin) {
    if (sizeOf(item) > capacity) {
      return true
    }
  }
  return false
}

function anyEmpty(bins) {
  for (const bin of bins) {
    if (bin.length === 0) {
      return true
    }
  }
  return false
}

function numOversized(bin, sizeOf, capacity) {
  let count = 0
  for (const item of bin) {
    if (sizeOf(item) > capacity) {
      ++count
    }
  }
  return count
}

function getArrayKeyCount(bins) {
  return bins.reduce((acc, bin) => acc + bin.length, 0)
}

describe('bin-packer', function () {
  describe('algorithms', function () {
    describe('prepareValues', function () {
      function testPrepareValuesFor(algorithm) {
        const name = algorithm.name
        const method = algorithm.method
        it(`${name} should reject a non-positive capacity`, function () {
          expect(() => method([0, 1, 5], item => item, []))
              .toThrowError('Expected a number for capacity')
          expect(() => method([0, 1, 5], item => item, 0))
              .toThrowError('Capacity must be a positive number')
          expect(() => method([0, 1, 5], item => item, -3.2))
              .toThrowError('Capacity must be a positive number')
        })
        
        it(`${name} sizeOf must always return a number`, function () {
          expect(() => method([0, 1, 5], item => item.toString(), 10))
              .toThrowError('Expected a number for 0')
          expect(() => method([0, 1, {test: 100}, 5], item => item, 10))
              .toThrowError('Expected a number for 2')
        })
      }
      
      for (const algorithm of algorithms) {
        testPrepareValuesFor(algorithm)
      }
    })

    describe('results check', function () {
      /**
       * @param {PackedResult} result 
       */
      function resultChecks(results) {
        const algoName = results.algorithm.name
            , result = results.result
            , spec = results.dataSpec
            , dataName = spec.name

        it(`${algoName} should return as many keys as it was passed (${dataName})`, () => {
          expect(getArrayKeyCount(result.bins) + result.oversized.length).toEqual(spec.dataLength)
        })
      
        it(`${algoName} should have no empty bins (${dataName})`, function () {
          expect(anyEmpty(result.bins)).toBeFalsy()
        })
      
        it(`${algoName} should contain some oversized (${dataName})`, function () {
          if (spec.oversizedInData) {
            expect(result.oversized.length).toBeGreaterThan(0)
          } else {
            expect(result.oversized.length).toEqual(0)
          }
        })
      }

      function resultCapacityChecks(results) {
        const algoName = results.algorithm.name
            , result = results.result
            , spec = results.dataSpec
            , dataName = spec.name

        it(`${algoName} should not have any bins larger than capacity (${dataName})`, () => {
          expect(anyTooBig(
              result.bins,
              spec.sizeOf,
              spec.capacity)).toBeFalsy()
        })

        it(`${algoName} all oversized values should be > than capacity (${dataName})`, () => {
          expect(result.oversized)
              .toHaveSize(numOversized(result.oversized, spec.sizeOf, spec.capacity))
        })
      }

      /**
       * @param {array<PackedResult>} allResults
       */
      function relativeNumberOfBins(allResults) {
        const nextFit = findResultFor(allResults, 'nextFit').result
            , firstFit = findResultFor(allResults, 'firstFit').result
            , firstFitDecreasing = findResultFor(allResults, 'firstFitDecreasing').result
            , bestFitDecreasing = findResultFor(allResults, 'bestFitDecreasing').result
            , binCompletion = findResultFor(allResults, 'binCompletion')?.result
            , lowerBound1 = findResultFor(allResults, 'lowerBound1').result
            , lowerBound2 = findResultFor(allResults, 'lowerBound2').result
            , arbitrarySpec = allResults[0].dataSpec // All results have the same DataSpec
            , dataName = arbitrarySpec.name
        
        it(`nextFit >= firstFit (${dataName})`, function () {
          expect(nextFit.bins.length).toBeGreaterThanOrEqual(firstFit.bins.length)
        })

        it(`firstFit >= firstFitDecreasing (${dataName})`, function () {
          expect(firstFit.bins.length).toBeGreaterThanOrEqual(firstFitDecreasing.bins.length)
        })

        it(`firstFitDecreasing >= bestFitDecreasing (${dataName})`, function () {
          expect(firstFitDecreasing.bins.length)
              .toBeGreaterThanOrEqual(bestFitDecreasing.bins.length)
        })

        if (binCompletion) {
          it(`bestFitDecreasing >= binCompletion (${dataName})`, function () {
            expect(bestFitDecreasing.bins.length).toBeGreaterThanOrEqual(binCompletion.bins.length)
          })
        }

        it(`bestFitDecreasing >= optimal solution (${dataName})`, function () {
          expect(bestFitDecreasing.bins.length).toBeGreaterThanOrEqual(arbitrarySpec.optimalSize)
        })

        // Note: Exact algorithms are tested against the optimal solution in
        // exactAlgorithmShouldGetExactResult
        
        it(`lowerBound1 <= lowerBound2 (${dataName})`, function () {
          expect(lowerBound1.bound).toBeLessThanOrEqual(lowerBound2.bound)
          expect(lowerBound1.oversized).toEqual(lowerBound2.oversized)
        })
      }
      
      function exactAlgorithmShouldGetExactResult(exactResult) {
        const algoName = exactResult.algorithm.name
            , dataName = exactResult.dataSpec.name
        it(`exact algorithm ${algoName} should get the optimal solution (${dataName})`, () => {
          expect(exactResult.result.bins).toHaveSize(exactResult.dataSpec.optimalSize)
        })
      }

      function lowerBoundLessOrEqualToFitResult(lowerBound, fitResult) {
        const bound = lowerBound.result
            , result = fitResult.result
            , dataName = fitResult.dataSpec.name
            , boundName = lowerBound.algorithm.name
            , fitName = fitResult.algorithm.name
        it(`lower bound ${boundName} should be <= fit result ${fitName} (${dataName})`, () => {
          expect(bound.bound).toBeLessThanOrEqual(result.bins.length)
          expect(bound.oversized).toEqual(result.oversized.length)
        })
      }

      function boundInvariants(lowerBound) {
        const bound = lowerBound.result.bound
            , dataName = lowerBound.dataSpec.name
            , boundName = lowerBound.algorithm.name
            , dataLength = lowerBound.dataSpec.dataLength
            , exactSize = lowerBound.dataSpec.optimalSize
        it(`bound ${boundName} > 0 (${dataName})`, function () {
          expect(bound).toBeGreaterThan(0)
        })

        it(`bound ${boundName} <= size of data (${dataName})`, function () {
          expect(bound).toBeLessThanOrEqual(dataLength)
        })
        
        it(`lower bound ${boundName} <= exact solution (${dataName})`, function () {
          expect(bound).toBeLessThanOrEqual(exactSize)
        })
      }

      let i = 0
      for (const spec of dataSpecs) {
        if (i < specsToRun) {
          ++i
          // allResults has type array<PackedResult>
          const allResults = allResultsFor(spec, algorithms)
        
          relativeNumberOfBins(allResults)

          for (const result of allResults) {
            if (AlgorithmType.isPacking(result.algorithm.type)) {

              resultChecks(result)
              resultCapacityChecks(result)
              if (AlgorithmType.EXACT_PACKING === result.algorithm.type) {
                exactAlgorithmShouldGetExactResult(result)
              }
              // Check all lower bounds are less than this packing's size
              allResults
                  .filter(r => AlgorithmType.LOWER_BOUND === r.algorithm.type)
                  .forEach(lb => lowerBoundLessOrEqualToFitResult(lb, result))
            } else if (AlgorithmType.LOWER_BOUND === result.algorithm.type) {
              boundInvariants(result)
            }
          }
        }
      }
    })
  })

  describe('empty input', function () {
    function emptyInputToEmptyPacking(algorithm) {
      it(`should produce empty arrays (${algorithm.name})`, function () {
        // sizeOf and capacity are arbitrary
        const packing = algorithm.method([], itemIsSize, 100)
        expect(packing.bins).toHaveSize(0)
        expect(packing.oversized).toHaveSize(0)
      })
    }

    for (const algorithm of algorithms) {
      if (AlgorithmType.isPacking(algorithm.type)) {
        emptyInputToEmptyPacking(algorithm)
      }
    }
  })
})

describe('utils', function () {
  describe('sortDescending', function () {
    function sortOrder(dataSpec) {
      it(`should not sort a smaller value before a larger value ${dataSpec.name}`, function () {
        const sorted = utils.sortDescending(dataSpec.data.slice(), dataSpec.sizeOf)
        expect(sorted).toHaveSize(dataSpec.data.length)
        for (let i = 0; i < sorted.length - 1; ++i) {
          if (dataSpec.sizeOf(sorted[i]) < dataSpec.sizeOf(sorted[i + 1])) {
            fail(`size ${dataSpec.sizeOf(sorted[i])} at index ${i} < ` +
                `${dataSpec.sizeOf(sorted[i + 1])} at index ${i + 1}`)
          }
        }
      })
    }
    dataSpecs.forEach(spec => sortOrder(spec))
  })
  
  describe('sortAscending', function () {
    function sortOrder(dataSpec) {
      it(`should not sort a larger value before a smaller value ${dataSpec.name}`, function () {
        const sorted = utils.sortAscending(dataSpec.data.slice(), dataSpec.sizeOf)
        expect(sorted).toHaveSize(dataSpec.data.length)
        for (let i = 0; i < sorted.length - 1; ++i) {
          if (dataSpec.sizeOf(sorted[i]) > dataSpec.sizeOf(sorted[i + 1])) {
            fail(`size ${dataSpec.sizeOf(sorted[i])} at index ${i} > ` +
                `${dataSpec.sizeOf(sorted[i + 1])} at index ${i + 1}`)
          }
        }
      })
    }
    dataSpecs.forEach(spec => sortOrder(spec))
  })
})
