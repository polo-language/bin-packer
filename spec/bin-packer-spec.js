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

function getKeyCount(testBins) {
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
        expect(getKeyCount(next)).toEqual(Object.keys(data).length)
      })

      it('should not have any bins larger than max', function () {
        if (oversizedInData)
          next.pop() // remove last bin with the oversized
        expect(anyTooBig(next, max)).toBeFalsy()
      })

      it('all keys in the last bin should be oversized', function () {
        const oversized = next.pop()
        expect(numOversized(oversized, max) === Object.keys(oversized).length).toBeTruthy()
      })

      it('should have no empty bins', function () {
        if (!oversizedInData)
          next.pop()
        expect(anyEmpty(next)).toBeFalsy()
      })
    })

    describe('firstFit', function () {
      it('should return as many keys as it was passed', function () {
        expect(getKeyCount(first)).toEqual(Object.keys(data).length)
      })

      it('should not have any larger than max outside of the last bin', function () {
        if (oversizedInData)
          first.pop() // remove last bin with the oversized
        expect(anyTooBig(first, max)).toBeFalsy()
      })

      it('all keys in the last bin should be oversized', function () {
        const oversized = first.pop()
        expect(numOversized(oversized, max) === Object.keys(oversized).length).toBeTruthy()
      })

      it('should have no empty bins', function () {
        if (!oversizedInData)
          first.pop()
        expect(anyEmpty(first)).toBeFalsy()
      })
    })

    describe('firstFitDecreasing', function () {
      it('should return as many keys as it was passed', function () {
        expect(getKeyCount(firstDec)).withContext(firstDec).toEqual(Object.keys(data).length)
      })

      it('should not have any bins larger than max', function () {
        if (oversizedInData)
          firstDec.pop() // remove last bin with the oversized
        expect(anyTooBig(firstDec, max)).toBeFalsy()
      })

      it('all keys in the last bin should be oversized', function () {
        const oversized = firstDec.pop()
        expect(numOversized(oversized, max) === Object.keys(oversized).length).toBeTruthy()
      })

      it('should have no empty bins', function () {
        if (!oversizedInData)
          firstDec.pop()
        expect(anyEmpty(firstDec)).toBeFalsy()
      })
    })

    describe('relative number of bins', function () {
      it('nextFit >= firstFit', function () {
        expect(next.length >= first.length).toBeTruthy()
      })

      it('firstFit >= firstFitDecreasing', function () {
        expect(first.length >= firstDec.length).toBeTruthy()
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
        expect(getKeyCount(next)).toEqual(Object.keys(data).length)
      })

      it('should contain some oversized', function () {
        if (oversizedInData)
          expect(anyTooBig(next, max)).toBeTruthy()
        else
          expect(anyTooBig(next, max)).toBeFalsy()
      })
    })

    describe('firstFit', function () {
      it('should return as many keys as it was passed', function () {
        expect(getKeyCount(first)).toEqual(Object.keys(data).length)
      })

      it('should contain some oversized', function () {
        if (oversizedInData)
          expect(anyTooBig(first, max)).toBeTruthy()
        else
          expect(anyTooBig(first, max)).toBeFalsy()
      })
    })

    describe('firstFitDecreasing', function () {
      it('should return as many keys as it was passed', function () {
        expect(getKeyCount(firstDec)).toEqual(Object.keys(data).length)
      })

      it('should contain some oversized', function () {
        if (oversizedInData)
          expect(anyTooBig(firstDec, max)).toBeTruthy()
        else
          expect(anyTooBig(firstDec, max)).toBeFalsy()
      })
    })

    describe('relative number of bins', function () {
      it('nextFit >= firstFit', function () {
        expect(next.length >= first.length).toBeTruthy()
      })

      it('firstFit >= firstFitDecreasing', function () {
        expect(first.length >= firstDec.length).toBeTruthy()
      })
    })
  })
})

describe('quicksort-obj', function () {
  describe('getMedianOfThree', function () {
    const perms = [ [{'0': {idem: '0'}}, {'1': {idem: '1'}}, {'2': {idem: '2'}}],
                  [{'0': {idem: '0'}}, {'2': {idem: '2'}}, {'1': {idem: '1'}}],
                  [{'1': {idem: '1'}}, {'0': {idem: '0'}}, {'2': {idem: '2'}}],
                  [{'1': {idem: '1'}}, {'2': {idem: '2'}}, {'0': {idem: '0'}}],
                  [{'2': {idem: '2'}}, {'0': {idem: '0'}}, {'1': {idem: '1'}}],
                  [{'2': {idem: '2'}}, {'1': {idem: '1'}}, {'0': {idem: '0'}}] ]
      , correctAnswers = [1, 2, 0, 0, 2, 1]

    it('should find the location of 1 each time', function () {
      for (const i in perms) {
        const foundMedian = quicksortObj._getMedianOfThree(perms[i], 'idem', 0, perms[i].length - 1)
        expect(foundMedian).toEqual(correctAnswers[i])
      }
    })
  })

  describe('getArrayOfObjSingletons', function () {
    const array = quicksortObj._getArrayOfObjSingletons(data)

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
      const sorted = quicksortObj.quicksortObj(data, measure)
      let outOfPlace = false
      for (const i = 0; i < sorted.lengh - 1; ++i) {
        if (sorted[i] > sorted[i + 1]) {
          outOfPlace = true
          break
        }
      }
      expect(outOfPlace).toBeFalsy()
    })
  })
})
