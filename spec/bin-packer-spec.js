'use strict'

const fs = require('fs')
    , dataFilePath = './spec/data/data_04.json'
    , data = JSON.parse(fs.readFileSync(dataFilePath))
    , binPacker = require('../lib/bin-packer')
    , utils = require('../lib/util/utils')
    , sizeOf = item => item.size
    , capacity = 32.7
    , oversizedInData = true

function anyTooBig(testBins, capacity) {
  for (const i in testBins) {
    for (const key in testBins[i]) {
      if (sizeOf(testBins[i][key]) > capacity) {
        return true
      }
    }
  }
  return false
}

function anyEmpty(testBins) {
  for (const i in testBins) {
    if (Object.keys(testBins[i]).length === 0) {
      return true
    }
  }
  return false
}

function numOversized(obj, capacity) {
  let count = 0

  for (const key in obj) {
    if (sizeOf(obj[key]) > capacity) {
      ++count
    }
  }
  return count
}

function getArrayKeyCount(testBins) {
  return testBins.reduce(function (previous, currentBin) {
    return previous + Object.keys(currentBin).length
  }, 0)
}

describe('bin-packer', function () {
  describe('algorithms', function () {
      let next
        , first
        , firstDec
        , bestDec
        , lowerBound1
        , lowerBound2

    beforeAll(function () {
      next = binPacker.nextFit(data.slice(), sizeOf, capacity)
      first = binPacker.firstFit(data.slice(), sizeOf, capacity)
      firstDec = binPacker.firstFitDecreasing(data.slice(), sizeOf, capacity)
      bestDec = binPacker.bestFitDecreasing(data.slice(), sizeOf, capacity)
      lowerBound1 = binPacker.lowerBound1(data.slice(), sizeOf, capacity)
      lowerBound2 = binPacker.lowerBound2(data.slice(), sizeOf, capacity)
    })

    describe('nextFit', function () {
      it('should return as many keys as it was passed', function () {
        expect(getArrayKeyCount(next.bins) + Object.keys(next.oversized).length)
            .toEqual(Object.keys(data).length)
      })

      it('should not have any bins larger than capacity', function () {
        expect(anyTooBig(next.bins, capacity)).toBeFalsy()
      })

      it('all values in the oversized bin should be larger than capacity', function () {
        expect(numOversized(next.oversized, capacity) === Object.keys(next.oversized).length).toBeTruthy()
      })

      it('should have no empty bins', function () {
        expect(anyEmpty(next.bins)).toBeFalsy()
      })

      it('should contain some oversized', function () {
        if (oversizedInData) {
          expect(Object.keys(next.oversized).length).toBeGreaterThan(0)
        } else {
          expect(Object.keys(next.oversized).length).toEqual(0)
        }
      })
    })

    describe('firstFit', function () {
      it('should return as many keys as it was passed', function () {
        expect(getArrayKeyCount(first.bins) + Object.keys(first.oversized).length)
            .toEqual(Object.keys(data).length)
      })

      it('should not have any larger than capacity', function () {
        expect(anyTooBig(first.bins, capacity)).toBeFalsy()
      })

      it('all values in the oversized bin should be larger than capacity', function () {
        expect(numOversized(first.oversized, capacity) === Object.keys(first.oversized).length).toBeTruthy()
      })

      it('should have no empty bins', function () {
        expect(anyEmpty(first.bins)).toBeFalsy()
      })

      it('should contain some oversized', function () {
        if (oversizedInData) {
          expect(Object.keys(first.oversized).length).toBeGreaterThan(0)
        } else {
          expect(Object.keys(first.oversized).length).toEqual(0)
        }
      })
    })

    describe('firstFitDecreasing', function () {
      it('should return as many keys as it was passed', function () {
        expect(getArrayKeyCount(firstDec.bins) + Object.keys(firstDec.oversized).length)
            .withContext(firstDec.bins)
            .toEqual(Object.keys(data).length)
      })

      it('should not have any bins larger than capacity', function () {
        expect(anyTooBig(firstDec.bins, capacity)).toBeFalsy()
      })

      it('all values in the oversized bin should be larger than capacity', function () {
        expect(numOversized(firstDec.oversized, capacity) === Object.keys(firstDec.oversized).length).toBeTruthy()
      })

      it('should have no empty bins', function () {
        expect(anyEmpty(firstDec.bins)).toBeFalsy()
      })

      it('should contain some oversized', function () {
        if (oversizedInData) {
          expect(Object.keys(firstDec.oversized).length).toBeGreaterThan(0)
        } else {
          expect(Object.keys(firstDec.oversized).length).toEqual(0)
        }
      })
    })

    describe('bestFitDecreasing', function () {
      it('should return as many keys as it was passed', function () {
        expect(getArrayKeyCount(bestDec.bins) + Object.keys(bestDec.oversized).length)
            .withContext(bestDec.bins)
            .toEqual(Object.keys(data).length)
      })

      it('should not have any bins larger than capacity', function () {
        expect(anyTooBig(bestDec.bins, capacity)).toBeFalsy()
      })

      it('all values in the oversized bin should be larger than capacity', function () {
        expect(numOversized(bestDec.oversized, capacity) === Object.keys(bestDec.oversized).length).toBeTruthy()
      })

      it('should have no empty bins', function () {
        expect(anyEmpty(bestDec.bins)).toBeFalsy()
      })

      it('should contain some oversized', function () {
        if (oversizedInData) {
          expect(Object.keys(bestDec.oversized).length).toBeGreaterThan(0)
        } else {
          expect(Object.keys(bestDec.oversized).length).toEqual(0)
        }
      })
    })

    describe('relative number of bins', function () {
      it('nextFit >= firstFit', function () {
        expect(next.bins.length >= first.bins.length).toBeTruthy()
      })

      it('firstFit >= firstFitDecreasing', function () {
        expect(first.bins.length >= firstDec.bins.length).toBeTruthy()
      })

      it('firstFitDecreasing >= bestFitDecreasing', function () {
        expect(firstDec.bins.length >= bestDec.bins.length).toBeTruthy()
      })

      it('lowerBound1 <= all solutions', function () {
        expect(lowerBound1 <= next.bins.length + next.oversized.length)
        expect(lowerBound1 <= first.bins.length + first.oversized.length)
        expect(lowerBound1 <= firstDec.bins.length + firstDec.oversized.length)
        expect(lowerBound1 <= firstDec.bins.length + firstDec.oversized.length)
      })

      it('lowerBound2 < all solutions', function () {
        expect(lowerBound2 <= next.bins.length + next.oversized.length)
        expect(lowerBound2 <= first.bins.length + first.oversized.length)
        expect(lowerBound2 <= firstDec.bins.length + firstDec.oversized.length)
        expect(lowerBound2 <= firstDec.bins.length + firstDec.oversized.length)
      })
      
      it('lowerBound1 <= lowerBound2', function () {
        expect(0 < lowerBound1)
        expect(lowerBound1 <= lowerBound2)
        expect(lowerBound2 <= Object.keys(data).length)
      })
    })
  })

  describe('empty input', function () {
      const next = binPacker.nextFit([], sizeOf, capacity)
          , first = binPacker.firstFit([], sizeOf, capacity)
          , firstDec = binPacker.firstFitDecreasing([], sizeOf, capacity)
          , bestDec = binPacker.bestFitDecreasing([], sizeOf, capacity)

    it('should produce empty arrays', function () {
      expect(next.bins.length).toEqual(0)
      expect(next.oversized.length).toEqual(0)
      expect(first.bins.length).toEqual(0)
      expect(first.oversized.length).toEqual(0)
      expect(firstDec.bins.length).toEqual(0)
      expect(firstDec.oversized.length).toEqual(0)
      expect(bestDec.bins.length).toEqual(0)
      expect(bestDec.oversized.length).toEqual(0)
    })
  })
})

describe('utils', function () {
  describe('sortDecreasing', function () {
    it('should not sort a smaller value before a larger value', function () {
      const sorted = utils.sortDecreasing(data.slice(), sizeOf)
      expect(sorted.length).toEqual(data.length)
      for (let i = 0; i < sorted.length - 1; ++i) {
        if (sizeOf(sorted[i]) < sizeOf(sorted[i + 1])) {
          fail(`size ${sizeOf(sorted[i])} at index ${i} < ${sizeOf(sorted[i + 1])} at index ${i + 1}`)
        }
      }
    })
  })
})
