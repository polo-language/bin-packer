/* global describe, it, expect, beforeEach */
'use strict'

const fs = require('fs')
  , dataFilePath = './spec/data/data_04.json'
  , data = JSON.parse(fs.readFileSync(dataFilePath))
  , binPacker = require('../lib/bin-packer')
  , quicksortObj = require('../lib/util/quicksort-obj')
  , measure = 'size'
  //, measure = 'att'
  , max = 32.7
  , oversizedInData = true

function anyTooBig(testBins, maximum) {
  for (const i in testBins) {
    for (const key in testBins[i]) {
      if (testBins[i][key][measure] > maximum) {
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

function numOversized(obj, maximum) {
  let count = 0

  for (const key in obj) {
    if (obj[key][measure] > maximum) {
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
  describe('without oversized', function () {
      const addOversize = false
      let next
        , first
        , firstDec

    beforeEach(function (done) {
      next = binPacker.nextFit(data, measure, max, addOversize)
      first = binPacker.firstFit(data, measure, max, addOversize)
      firstDec = binPacker.firstFitDecreasing(data, measure, max, addOversize)
      done()
    })

    describe('nextFit', function () {
      it('should return as many keys as it was passed', function () {
        expect(getArrayKeyCount(next.bins) + Object.keys(next.oversized).length + Object.keys(next.invalid).length)
            .toEqual(Object.keys(data).length)
      })

      it('should not have any bins larger than max', function () {
        expect(anyTooBig(next.bins, max)).toBeFalsy()
      })

      it('all values in the oversized bin should be larger than max', function () {
        expect(numOversized(next.oversized, max) === Object.keys(next.oversized).length).toBeTruthy()
      })

      it('should have no empty bins', function () {
        expect(anyEmpty(next.bins)).toBeFalsy()
      })
    })

    describe('firstFit', function () {
      it('should return as many keys as it was passed', function () {
        expect(getArrayKeyCount(first.bins) + Object.keys(first.oversized).length + Object.keys(first.invalid).length)
            .toEqual(Object.keys(data).length)
      })

      it('should not have any larger than max outside of the last bin', function () {
        expect(anyTooBig(first.bins, max)).toBeFalsy()
      })

      it('all keys in the last bin should be oversized', function () {
        expect(numOversized(first.oversized, max) === Object.keys(first.oversized).length).toBeTruthy()
      })

      it('should have no empty bins', function () {
        expect(anyEmpty(first.bins)).toBeFalsy()
      })
    })

    describe('firstFitDecreasing', function () {
      it('should return as many keys as it was passed', function () {
        expect(getArrayKeyCount(firstDec.bins) + Object.keys(firstDec.oversized).length + Object.keys(firstDec.invalid).length)
            .withContext(firstDec.bins)
            .toEqual(Object.keys(data).length)
      })

      it('should not have any bins larger than max', function () {
        expect(anyTooBig(firstDec.bins, max)).toBeFalsy()
      })

      it('all keys in the last bin should be oversized', function () {
        expect(numOversized(firstDec.oversized, max) === Object.keys(firstDec.oversized).length).toBeTruthy()
      })

      it('should have no empty bins', function () {
        expect(anyEmpty(firstDec.bins)).toBeFalsy()
      })
    })

    describe('relative number of bins', function () {
      it('nextFit >= firstFit', function () {
        expect(next.bins.length >= first.bins.length).toBeTruthy()
      })

      it('firstFit >= firstFitDecreasing', function () {
        expect(first.bins.length >= firstDec.bins.length).toBeTruthy()
      })
    })
  })

  describe('with oversized', function () {
      const addOversize = true
      let next
        , first
        , firstDec

    beforeEach(function (done) {
      next = binPacker.nextFit(data, measure, max, addOversize)
      first = binPacker.firstFit(data, measure, max, addOversize)
      firstDec = binPacker.firstFitDecreasing(data, measure, max, addOversize)
      done()
    })

    describe('nextFit', function () {
      it('should return as many keys as it was passed', function () {
        expect(getArrayKeyCount(next.bins) + Object.keys(next.oversized).length + Object.keys(next.invalid).length)
            .toEqual(Object.keys(data).length)
      })

      it('should contain some oversized', function () {
        if (oversizedInData)
          expect(Object.keys(next.oversized).length).toBeGreaterThan(0)
        else
          expect(Object.keys(next.oversized).length).toEqual(0)
      })
    })

    describe('firstFit', function () {
      it('should return as many keys as it was passed', function () {
        expect(getArrayKeyCount(first.bins) + Object.keys(first.oversized).length + Object.keys(first.invalid).length)
            .toEqual(Object.keys(data).length)
      })

      it('should contain some oversized', function () {
        if (oversizedInData)
          expect(Object.keys(first.oversized).length).toBeGreaterThan(0)
        else
          expect(Object.keys(first.oversized).length).toEqual(0)
      })
    })

    describe('firstFitDecreasing', function () {
      it('should return as many keys as it was passed', function () {
        expect(getArrayKeyCount(firstDec.bins) + Object.keys(firstDec.oversized).length + Object.keys(firstDec.invalid).length).toEqual(Object.keys(data).length)
      })

      it('should contain some oversized', function () {
        if (oversizedInData)
          expect(Object.keys(firstDec.oversized).length).toBeGreaterThan(0)
        else
          expect(Object.keys(firstDec.oversized).length).toEqual(0)
      })
    })

    describe('relative number of bins', function () {
      it('nextFit >= firstFit', function () {
        expect(next.bins.length >= first.bins.length).toBeTruthy()
      })

      it('firstFit >= firstFitDecreasing', function () {
        expect(first.bins.length >= firstDec.bins.length).toBeTruthy()
      })
    })
  })
})

describe('quicksort-obj', function () {
  describe('getMedianOfThree', function () {
    const perms = [ [{'0': {idem: 0}}, {'1': {idem: 1}}, {'2': {idem: 2}}],
                  [{'0': {idem: 0}}, {'2': {idem: 2}}, {'1': {idem: 1}}],
                  [{'1': {idem: 1}}, {'0': {idem: 0}}, {'2': {idem: 2}}],
                  [{'1': {idem: 1}}, {'2': {idem: 2}}, {'0': {idem: 0}}],
                  [{'2': {idem: 2}}, {'0': {idem: 0}}, {'1': {idem: 1}}],
                  [{'2': {idem: 2}}, {'1': {idem: 1}}, {'0': {idem: 0}}] ]
      , correctAnswers = [1, 2, 0, 0, 2, 1]

    it('should find the location of 1 each time', function () {
      for (const i in perms) {
        const foundMedian = quicksortObj._getMedianOfThree(perms[i], 'idem', 0, perms[i].length - 1)
        expect(foundMedian).toEqual(correctAnswers[i])
      }
    })
  })

  describe('getArrayOfObjSingletons', function () {
    const {singletons: array} = quicksortObj._getArrayOfObjSingletons(data)

    it('should have length equal to number of keys in data', function () {
      expect(array.length).toEqual(Object.keys(data).length)
    })

    it('should contain an object in each cell', function () {
      let failedType = false

      for (const i in array) {
        if (Object.prototype.toString.call(array[i]) !== '[object Object]') {
          failedType = true
          break
        }
      }
      expect(failedType).toBeFalsy()
    })

    it('should contain an exactly one key in each cell', function () {
      let failedCount = false

      for (const i in array) {
        if (Object.keys(array[i]).length !== 1) {
          failedCount = true
          break
        }
      }
      expect(failedCount).toBeFalsy()
    })
  })

  describe('quicksortObj', function () {

    it('should not sort a larger value before a smaller value', function () {
      const {sorted: sorted} = quicksortObj.quicksortObj(data, measure)
      let outOfPlace = false
      for (let i = 0; i < sorted.length - 1; ++i) {
        if (sorted[i] > sorted[i + 1]) {
          outOfPlace = true
          break
        }
      }
      expect(outOfPlace).toBeFalsy()
    })
  })
})
