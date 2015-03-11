/* global describe, it, expect */
'use strict'
var data = {
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
describe('bin-packer', function () {
  describe('nextFit', function () {
    var max = 85
    var addOversize = false
    var count
    var bins = nextFit(data, 'size', max, addOversize);
    it('should return as many keys as it was passed', function () {
      count = bins.reduce(function (previous, currentBin) {
        return previous + currentBin.keys.length
      })
      expect(count).toEqual(data.keys.length)
    })
  })

  describe('firstFit', function () {
    var max = 85
    var addOversize = false
    var count
    var bins = firstFit(data, 'size', max, addOversize);
    it('should return as many keys as it was passed', function () {
      count = bins.reduce(function (previous, currentBin) {
        return previous + currentBin.keys.length
      })
    })
    expect(count).toEqual(data.keys.length)
  })
})
