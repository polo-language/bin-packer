/* global describe, it, expect, beforeEach */
'use strict'

var fs = require('fs')
  , dataFilePath = './test/data/data_01.json'
  , data = JSON.parse(fs.readFileSync(dataFilePath))
  , binPacker = require('../bin-packer')

function anyTooBig(testBins, maximum) {
  var tooBig = false
  for (var i in testBins) {
    if (Object.keys(testBins[i]) > maximum) {
      tooBig = true
    }
  }
  return tooBig
}

describe('bin-packer', function () {
  describe('nextFit', function () {
    var max = 85
      , addOversize = true
      , count
      , bins = binPacker.nextFit(data, 'size', max, addOversize)

    it('should return as many keys as it was passed', function () {
      count = bins.reduce(function (previous, currentBin) {
        return previous + Object.keys(currentBin).length
      }, 0)

      expect(count).toEqual(Object.keys(data).length)
    })

    it('should not have any bins larger than max', function () {
      expect(anyTooBig(bins, max)).toBeFalsy()
    })
  })

  describe('firstFit', function () {
    var max = 85
      , addOversize = false
      , count
      , bins = binPacker.firstFit(data, 'size', max, addOversize)

    it('should return as many keys as it was passed', function () {
      count = bins.reduce(function (previous, currentBin) {
        return previous + Object.keys(currentBin).length
      }, 0)

      expect(count).toEqual(Object.keys(data).length)
    })

    it('should not have any bins larger than max', function () {
      expect(anyTooBig(bins, max)).toBeFalsy()
    })
  })

  describe('relative number of bins', function () {
    var max = 85
      , addOversize = false
      , count
      , binsNext = binPacker.nextFit(data, 'size', max, addOversize)
      , binsFirst = binPacker.firstFit(data, 'size', max, addOversize)

    it('nextFit >= firstFit', function () {
      expect(binsNext.length >= binsFirst.length).toBeTruthy()
    })

  })
})
