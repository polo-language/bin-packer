'use strict'

const fs = require('fs')
    , dataFilePath = './spec/data/data_04.json'
    , data = JSON.parse(fs.readFileSync(dataFilePath))
    , binPacker = require('../lib/bin-packer')
    , utils = require('../lib/util/utils')
    , sizeOf = item => item.size
    , capacity = 32.7
    , dataArray = utils.toArray(data)
    , dataLength = dataArray.length
    , oversizedInData = anyTooBigInBin(dataArray, capacity)

function anyTooBig(bins, capacity) {
  for (const bin of bins) {
    if (anyTooBigInBin(bin, capacity)) {
      return true
    }
  }
  return false
}

function anyTooBigInBin(bin, capacity) {
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

function numOversized(bin, capacity) {
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
        expect(getArrayKeyCount(next.bins) + next.oversized.length)
            .toEqual(dataLength)
      })

      it('should not have any bins larger than capacity', function () {
        expect(anyTooBig(next.bins, capacity)).toBeFalsy()
      })

      it('all values in the oversized bin should be larger than capacity', function () {
        expect(numOversized(next.oversized, capacity)).toEqual(next.oversized.length)
      })

      it('should have no empty bins', function () {
        expect(anyEmpty(next.bins)).toBeFalsy()
      })

      it('should contain some oversized', function () {
        if (oversizedInData) {
          expect(next.oversized.length).toBeGreaterThan(0)
        } else {
          expect(next.oversized.length).toEqual(0)
        }
      })
    })

    describe('firstFit', function () {
      it('should return as many keys as it was passed', function () {
        expect(getArrayKeyCount(first.bins) + first.oversized.length)
            .toEqual(dataLength)
      })

      it('should not have any larger than capacity', function () {
        expect(anyTooBig(first.bins, capacity)).toBeFalsy()
      })

      it('all values in the oversized bin should be larger than capacity', function () {
        expect(numOversized(first.oversized, capacity)).toEqual(first.oversized.length)
      })

      it('should have no empty bins', function () {
        expect(anyEmpty(first.bins)).toBeFalsy()
      })

      it('should contain some oversized', function () {
        if (oversizedInData) {
          expect(first.oversized.length).toBeGreaterThan(0)
        } else {
          expect(first.oversized.length).toEqual(0)
        }
      })
    })

    describe('firstFitDecreasing', function () {
      it('should return as many keys as it was passed', function () {
        expect(getArrayKeyCount(firstDec.bins) + firstDec.oversized.length)
            .withContext(firstDec.bins)
            .toEqual(dataLength)
      })

      it('should not have any bins larger than capacity', function () {
        expect(anyTooBig(firstDec.bins, capacity)).toBeFalsy()
      })

      it('all values in the oversized bin should be larger than capacity', function () {
        expect(numOversized(firstDec.oversized, capacity)).toEqual(firstDec.oversized.length)
      })

      it('should have no empty bins', function () {
        expect(anyEmpty(firstDec.bins)).toBeFalsy()
      })

      it('should contain some oversized', function () {
        if (oversizedInData) {
          expect(firstDec.oversized.length).toBeGreaterThan(0)
        } else {
          expect(firstDec.oversized.length).toEqual(0)
        }
      })
    })

    describe('bestFitDecreasing', function () {
      it('should return as many keys as it was passed', function () {
        expect(getArrayKeyCount(bestDec.bins) + bestDec.oversized.length)
            .withContext(bestDec.bins)
            .toEqual(dataLength)
      })

      it('should not have any bins larger than capacity', function () {
        expect(anyTooBig(bestDec.bins, capacity)).toBeFalsy()
      })

      it('all values in the oversized bin should be larger than capacity', function () {
        expect(numOversized(bestDec.oversized, capacity)).toEqual(bestDec.oversized.length)
      })

      it('should have no empty bins', function () {
        expect(anyEmpty(bestDec.bins)).toBeFalsy()
      })

      it('should contain some oversized', function () {
        if (oversizedInData) {
          expect(bestDec.oversized.length).toBeGreaterThan(0)
        } else {
          expect(bestDec.oversized.length).toEqual(0)
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
        expect(lowerBound1.bound).toBeLessThanOrEqual(next.bins.length)
        expect(lowerBound1.oversized).toEqual(next.oversized.length)
        
        expect(lowerBound1.bound).toBeLessThanOrEqual(first.bins.length)
        expect(lowerBound1.oversized).toEqual(first.oversized.length)
        
        expect(lowerBound1.bound).toBeLessThanOrEqual(firstDec.bins.length)
        expect(lowerBound1.oversized).toEqual(firstDec.oversized.length)
        
        expect(lowerBound1.bound).toBeLessThanOrEqual(firstDec.bins.length)
        expect(lowerBound1.oversized).toEqual(firstDec.oversized.length)
      })

      it('lowerBound2 < all solutions', function () {
        expect(lowerBound2.bound).toBeLessThanOrEqual(next.bins.length)
        expect(lowerBound2.oversized).toEqual(next.oversized.length)
        
        expect(lowerBound2.bound).toBeLessThanOrEqual(first.bins.length)
        expect(lowerBound2.oversized).toEqual(first.oversized.length)
        
        expect(lowerBound2.bound).toBeLessThanOrEqual(firstDec.bins.length)
        expect(lowerBound2.oversized).toEqual(firstDec.oversized.length)
        
        expect(lowerBound2.bound).toBeLessThanOrEqual(firstDec.bins.length)
        expect(lowerBound2.oversized).toEqual(firstDec.oversized.length)
      })
      
      it('lowerBound1 <= lowerBound2', function () {
        expect(0).toBeLessThan(lowerBound1.bound)
        expect(lowerBound1.bound).toBeLessThanOrEqual(lowerBound2.bound)
        expect(lowerBound2.bound).toBeLessThanOrEqual(dataLength)
        
        expect(lowerBound1.oversized).toEqual(lowerBound2.oversized)
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
  describe('sortDescending', function () {
    it('should not sort a smaller value before a larger value', function () {
      const sorted = utils.sortDescending(data.slice(), sizeOf)
      expect(sorted.length).toEqual(data.length)
      for (let i = 0; i < sorted.length - 1; ++i) {
        if (sizeOf(sorted[i]) < sizeOf(sorted[i + 1])) {
          fail(`size ${sizeOf(sorted[i])} at index ${i} < ${sizeOf(sorted[i + 1])} at index ${i + 1}`)
        }
      }
    })
  })
  
  describe('sortAscending', function () {
    it('should not sort a larger value before a smaller value', function () {
      const sorted = utils.sortAscending(data.slice(), sizeOf)
      expect(sorted.length).toEqual(data.length)
      for (let i = 0; i < sorted.length - 1; ++i) {
        if (sizeOf(sorted[i]) > sizeOf(sorted[i + 1])) {
          fail(`size ${sizeOf(sorted[i])} at index ${i} > ${sizeOf(sorted[i + 1])} at index ${i + 1}`)
        }
      }
    })
  })
})
