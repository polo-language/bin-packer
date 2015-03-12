/* global describe, it, expect, beforeEach */
'use strict'
var data_02 = {
  'a': {
    color: 'red',
    value: '#f00',
    size: 100
  },
  'b': {
    color: 'green',
    value: '#0f0',
    size: 150
  },
  'c': {
    color: 'blue',
    value: '#00f',
    size: 10
  },
  'd': {
    color: 'cyan',
    value: '#0ff',
    size: 123
  },
  'e': {
    color: 'magenta',
    value: '#f0f',
    size: 109
  },
  'f': {
    color: 'yellow',
    value: '#ff0',
    size: 27
  },
  'g': {
    color: 'black',
    value: '#000',
    size: 75
  }
}

var fs = require('fs')
  , dataFilePath = './test/data/data_01.json'
  , data = JSON.parse(fs.readFileSync(dataFilePath))
  , binPacker = require('../bin-packer')

describe('bin-packer', function () {
  describe('nextFit', function () {
    var max = 85
    var addOversize = true
    var count

    it('should return as many keys as it was passed', function () {
      var bins = binPacker.nextFit(data, 'size', max, addOversize);
      count = bins.reduce(function (previous, currentBin) {
        return previous + Object.keys(currentBin).length
      }, 0)

      expect(count).toEqual(Object.keys(data).length)
    })
  })

  describe('firstFit', function () {
    var max = 85
    var addOversize = false
    var count

    it('should return as many keys as it was passed', function () {
      var bins = binPacker.firstFit(data, 'size', max, addOversize);
      count = bins.reduce(function (previous, currentBin) {
        return previous + Object.keys(currentBin).length
      }, 0)

      expect(count).toEqual(Object.keys(data).length)
    })
  })
})
