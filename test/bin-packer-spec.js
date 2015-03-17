/* global describe, it, expect, beforeEach */
'use strict'

var fs = require('fs')
  , dataFilePath = './test/data/data_01.json'
  , data = JSON.parse(fs.readFileSync(dataFilePath))
  , binPacker = require('../bin-packer')
  , quicksortObj = require('../quicksort-obj')
  //, measure = 'size'
  , measure = 'att'
  , max = 0.15
  , oversizedInData = true

function anyTooBig(testBins, maximum) {
  for (var i in testBins) {
    for (var key in testBins[i]) {
      if (testBins[i][key][measure] > maximum) {
        return true
      }
    }
  }
  return false
}

function anyEmpty(testBins) {
  for (var i in testBins) {
    if (Object.keys(testBins[i]).length === 0) {
      return true
    }
  }
  return false
}

function numOversized(obj, maximum) {
  var count = 0

  for (var key in obj) {
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
      var addOversize = false
        , next
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
        next.pop() // remove last bin with the oversized
        expect(anyTooBig(next, max)).toBeFalsy()
      })

      it('all keys in the last bin should be oversized', function () {
        var oversized = next.pop()
        expect(numOversized(oversized, max) === Object.keys(oversized).length).toBeTruthy()
      })

      it('should have no empty bins', function () {
        expect(anyEmpty(next)).toBeFalsy()
      })
    })

    describe('firstFit', function () {
      it('should return as many keys as it was passed', function () {
        expect(getKeyCount(first)).toEqual(Object.keys(data).length)
      })

      it('should not have any larger than max outside of the last bin', function () {
        first.pop() // remove last bin with the oversized
        expect(anyTooBig(first, max)).toBeFalsy()
      })

      it('all keys in the last bin should be oversized', function () {
        var oversized = first.pop()
        expect(numOversized(oversized, max) === Object.keys(oversized).length).toBeTruthy()
      })

      it('should have no empty bins', function () {
        expect(anyEmpty(first)).toBeFalsy()
      })
    })

    describe('firstFitDecreasing', function () {
      it('should return as many keys as it was passed', function () {
        expect(getKeyCount(firstDec)).toEqual(Object.keys(data).length)
      })

      it('should not have any bins larger than max', function () {
        firstDec.pop() // remove last bin with the oversized
        expect(anyTooBig(firstDec, max)).toBeFalsy()
      })

      it('all keys in the last bin should be oversized', function () {
        var oversized = firstDec.pop()
        expect(numOversized(oversized, max) === Object.keys(oversized).length).toBeTruthy()
      })

      it('should have no empty bins', function () {
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
      var addOversize = true
        , next
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
    var perms = [ [{'0': {idem: '0'}}, {'1': {idem: '1'}}, {'2': {idem: '2'}}],
                  [{'0': {idem: '0'}}, {'2': {idem: '2'}}, {'1': {idem: '1'}}],
                  [{'1': {idem: '1'}}, {'0': {idem: '0'}}, {'2': {idem: '2'}}],
                  [{'1': {idem: '1'}}, {'2': {idem: '2'}}, {'0': {idem: '0'}}],
                  [{'2': {idem: '2'}}, {'0': {idem: '0'}}, {'1': {idem: '1'}}],
                  [{'2': {idem: '2'}}, {'1': {idem: '1'}}, {'0': {idem: '0'}}] ]
      , correctAnswers = [1, 2, 0, 0, 2, 1]

    it('should find the location of 1 each time', function () {
      for (var i in perms) {
        var foundMedian = quicksortObj._getMedianOfThree(perms[i], 'idem', 0, perms[i].length - 1)
        expect(foundMedian).toEqual(correctAnswers[i])
      }
    })
  })

  describe('getArrayOfObjSingletons', function () {
    var array = quicksortObj._getArrayOfObjSingletons(data)

    it('should have length equal to number of keys in data', function () {
      expect(array.length).toEqual(Object.keys(data).length)
    })

    it('should contain an object in each cell', function () {
      var failedType = false

      for (var i in array) {
        if (Object.prototype.toString.call(array[i]) !== '[object Object]') {
          failedType = true
          break
        }
      }
      expect(failedType).toBeFalsy()
    })

    it('should contain an exactly one key in each cell', function () {
      var failedCount = false

      for (var i in array) {
        if (Object.keys(array[i]).length !== 1) {
          failedCount = true
          break
        }
      }
      expect(failedCount).toBeFalsy()
    })
  })

  describe('quicksortObj', function () {
    var sorted = quicksortObj.quickSortObj(data, measure)
    var outOfPlace = false
    for (var i = 0; i < sorted.lengh - 1; ++i) {
      if (sorted[i] > sorted[i + 1]) {
        outOfPlace = true
        break
      }
    }
    expect(outOfPlace).toBeFalsy()
  })
})
