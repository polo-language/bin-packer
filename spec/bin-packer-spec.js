'use strict'

const fs = require('fs')
    , binPacker = require('../lib/bin-packer')
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
  constructor(path, sizeOf, capacity, optimalSize) {
    this.path = path
    this.data = JSON.parse(fs.readFileSync(path))
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
        new Algorithm('firstFitDecreasing', binPacker.firstFitDecreasing, AlgorithmType.APPROX_PACKING),
        new Algorithm('bestFitDecreasing', binPacker.bestFitDecreasing, AlgorithmType.APPROX_PACKING),
        new Algorithm('binCompletion', binPacker.binCompletion, AlgorithmType.EXACT_PACKING),
        new Algorithm('lowerBound1', binPacker.lowerBound1, AlgorithmType.LOWER_BOUND),
        new Algorithm('lowerBound2', binPacker.lowerBound2, AlgorithmType.LOWER_BOUND),
        ]
    , itemIsSize = item => item
    , dataSpecs = [
        new DataSpec('./spec/data/Falkenauer_u120_00_shuffled.json', itemIsSize, 150, 48),
        new DataSpec('./spec/data/Falkenauer_u120_01_shuffled.json', itemIsSize, 150, 49),
        new DataSpec('./spec/data/Falkenauer_u120_02_shuffled.json', itemIsSize, 150, 46),
        ]
    , allResultsEachData = dataSpecs.map(spec => allResultsFor(spec, algorithms))

/**
 * @param {DataSpec} dataSpec 
 * @param {array<Algorithm>} algorithms 
 * @returns {array<PackedResult>}
 */
function allResultsFor(dataSpec, algorithms) {
  const results = []
  for (const algorithm of algorithms) {
    results.push(new PackedResult(
        algorithm,
        dataSpec,
        algorithm.method(dataSpec.data.slice(), dataSpec.sizeOf, dataSpec.capacity)))
  }
  return results
}

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
    describe('validation', function () {
      function validationFor(algorithm) {
        const name = algorithm.name
        const method = algorithm.method
        it(`${name} should reject a non-positive capacity`, function () {
          expect(() => method([0, 1, 5], item => item, []))
          .toThrowError('expected a number for capacity')
          expect(() => method([0, 1, 5], item => item, 0))
          .toThrowError('Capacity must be a positive number')
          expect(() => method([0, 1, 5], item => item, -3.2))
          .toThrowError('Capacity must be a positive number')
        })
        
        it(`${name} sizeOf must always return a number`, function () {
          expect(() => method([0, 1, 5], item => item.toString(), 10))
          .toThrowError('expected a number for 0')
          expect(() => method([0, 1, {test: 100}, 5], item => item, 10))
          .toThrowError('expected a number for 2')
        })
      }
      
      for (const algorithm of algorithms) {
        validationFor(algorithm)
      }
    })

    describe('results check', function () {
      /**
       * @param {PackedResult} result 
       */
      function resultChecks(results) {
        const name = results.algorithm.name
        const result = results.result
        const spec = results.dataSpec

        it(`should return as many keys as it was passed (${name}, ${spec.path})`, function () {
          expect(getArrayKeyCount(result.bins) + result.oversized.length)
              .withContext(result.bins)
              .toEqual(spec.dataLength)
        })
      
        it(`should not have any bins larger than capacity (${name}, ${spec.path})`, function () {
          expect(anyTooBig(
              result.bins,
              spec.sizeOf,
              spec.capacity)).toBeFalsy()
        })
      
        it(`all oversized values should be > than capacity (${name}, ${spec.path})`, function () {
          expect(numOversized(result.oversized, spec.sizeOf, spec.capacity))
              .toEqual(result.oversized.length)
        })
      
        it(`should have no empty bins (${name}, ${spec.path})`, function () {
          expect(anyEmpty(result.bins)).toBeFalsy()
        })
      
        it(`should contain some oversized (${name}, ${spec.path})`, function () {
          if (spec.oversizedInData) {
            expect(result.oversized.length).toBeGreaterThan(0)
          } else {
            expect(result.oversized.length).toEqual(0)
          }
        })
      }

      /**
       * @param {Object} allResults   Output of function allResultsFor
       */
      function relativeNumberOfBins(allResults) {
        const nextFit = findResultFor(allResults, 'nextFit').result
            , firstFit = findResultFor(allResults, 'firstFit').result
            , firstFitDecreasing = findResultFor(allResults, 'firstFitDecreasing').result
            , bestFitDecreasing = findResultFor(allResults, 'bestFitDecreasing').result
            , binCompletion = findResultFor(allResults, 'binCompletion').result
            , lowerBound1 = findResultFor(allResults, 'lowerBound1').result
            , lowerBound2 = findResultFor(allResults, 'lowerBound2').result
            , arbitrarySpec = allResults[0].dataSpec // All results have the same DataSpec
            , path = arbitrarySpec.path
            , dataLength = arbitrarySpec.dataLength

        it(`nextFit >= firstFit (${path})`, function () {
          expect(nextFit.bins.length >= firstFit.bins.length).toBeTruthy()
        })

        it(`firstFit >= firstFitDecreasing (${path})`, function () {
          expect(firstFit.bins.length >= firstFitDecreasing.bins.length).toBeTruthy()
        })

        it(`firstFitDecreasing >= bestFitDecreasing (${path})`, function () {
          expect(firstFitDecreasing.bins.length >= bestFitDecreasing.bins.length).toBeTruthy()
        })
        
        it(`lowerBound1 <= lowerBound2 (${path})`, function () {
          expect(0).toBeLessThan(lowerBound1.bound)
          expect(lowerBound1.bound).toBeLessThanOrEqual(lowerBound2.bound)
          expect(lowerBound2.bound).toBeLessThanOrEqual(dataLength)
          
          expect(lowerBound1.oversized).toEqual(lowerBound2.oversized)
        })
      }
      
      function exactAlgorithmShouldGetExactResult(exactResult) {
        const name = exactResult.algorithm.name
            , path = exactResult.dataSpec.path
        it(`exact algorithm ${name} should get the exact result (${path})`, function () {
          expect(exactResult.result.bins.length).toEqual(exactResult.dataSpec.optimalSize)
        })
      }

      function lowerBoundLessOrEqualToSolution(lowerBound, fitResult) {
        const bound = lowerBound.result
            , result = fitResult.result
            , path = fitResult.dataSpec.path
            , boundName = lowerBound.algorithm.name
            , fitName = fitResult.algorithm.name
        it(`lower bound ${boundName} should be <= solution ${fitName} (${path})`, function () {
          expect(bound.bound).toBeLessThanOrEqual(result.bins.length)
          expect(bound.oversized).toEqual(result.oversized.length)
        })
      }

      // allResultsEachData: [[PackedResult]]
      // allResults: [PackedResult]
      // result: PackedResult
      for (const allResults of allResultsEachData) {
        
        relativeNumberOfBins(allResults)

        for (const result of allResults) {
          if (AlgorithmType.isPacking(result.algorithm.type)) {

            resultChecks(result)

            if (AlgorithmType.EXACT_PACKING === result.algorithm.type) {
              exactAlgorithmShouldGetExactResult(result)
            }

            for (const maybeBound of allResults) {
              if (AlgorithmType.LOWER_BOUND === maybeBound.algorithm.type) {
                lowerBoundLessOrEqualToSolution(maybeBound, result)
              }
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
        expect(packing.bins.length).toEqual(0)
        expect(packing.oversized.length).toEqual(0)
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
      it(`should not sort a smaller value before a larger value ${dataSpec.path}`, function () {
        const sorted = utils.sortDescending(dataSpec.data.slice(), dataSpec.sizeOf)
        expect(sorted.length).toEqual(dataSpec.data.length)
        for (let i = 0; i < sorted.length - 1; ++i) {
          if (dataSpec.sizeOf(sorted[i]) < dataSpec.sizeOf(sorted[i + 1])) {
            fail(`size ${dataSpec.sizeOf(sorted[i])} at index ${i} < ` +
                `${dataSpec.sizeOf(sorted[i + 1])} at index ${i + 1}`)
          }
        }
      })
    }
    
    for (const dataSpec of dataSpecs) {
      sortOrder(dataSpec)
    }
  })
  
  describe('sortAscending', function () {
    function sortOrder(dataSpec) {
      it(`should not sort a larger value before a smaller value ${dataSpec.path}`, function () {
        const sorted = utils.sortAscending(dataSpec.data.slice(), dataSpec.sizeOf)
        expect(sorted.length).toEqual(dataSpec.data.length)
        for (let i = 0; i < sorted.length - 1; ++i) {
          if (dataSpec.sizeOf(sorted[i]) > dataSpec.sizeOf(sorted[i + 1])) {
            fail(`size ${dataSpec.sizeOf(sorted[i])} at index ${i} > ` +
                `${dataSpec.sizeOf(sorted[i + 1])} at index ${i + 1}`)
          }
        }
      })
    }

    for (const dataSpec of dataSpecs) {
      sortOrder(dataSpec)
    }
  })
})
