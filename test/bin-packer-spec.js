/* global describe, it, expect, beforeEach, jasmine */
'use strict'

var fs = require('fs')
  , dataFilePath = './test/data/data_01.json'
  , data = JSON.parse(fs.readFileSync(dataFilePath))
  , binPacker = require('../bin-packer')
  , quicksortObj = require('../quicksort-obj')
  , measure = 'size'
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
      var max = 85
        , addOversize = false
        , next
        , first

    beforeEach(function (done) {
      next = binPacker.nextFit(data, measure, max, addOversize)
      first = binPacker.firstFit(data, measure, max, addOversize)
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
    })

    describe('relative number of bins', function () {
      it('nextFit >= firstFit', function () {
        expect(next.length >= first.length).toBeTruthy()
      })
    })
  })

  describe('with oversized', function () {
      var max = 85
        , addOversize = true
        , next
        , first

    beforeEach(function (done) {
      next = binPacker.nextFit(data, measure, max, addOversize)
      first = binPacker.firstFit(data, measure, max, addOversize)
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

    describe('relative number of bins', function () {
      it('nextFit >= firstFit', function () {
        expect(next.length >= first.length).toBeTruthy()
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
        var foundMedian = quicksortObj.getMedianOfThree(perms[i], 'idem', 0, perms[i].length - 1)
        expect(foundMedian).toEqual(correctAnswers[i])
      }
    })
  })

  describe('getArrayOfObjSingletons', function () {
    var array = quicksortObj.getArrayOfObjSingletons(data)

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
