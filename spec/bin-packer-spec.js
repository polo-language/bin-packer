/* global describe, it, expect, beforeEach */
'use strict'

const fs = require('fs')
    , dataFilePath = './spec/data/data_04.json'
    , data = JSON.parse(fs.readFileSync(dataFilePath))
    , binPacker = require('../lib/bin-packer')
    , quicksort = require('../lib/util/quicksort')
    , utils = require('../lib/util/utils')
    , measure = 'size'
    //, measure = 'att'
    , max = 32.7
    , oversizedInData = true
    , obj1 = { '43': {
          size: 2,
          sizeDecimal: 2.15,
          guid: '10324ecc-fcfa-4bc2-84b9-e595155a5b50',
          label: 'do'
        },
        '82': {
          size: 30,
          sizeDecimal: 30.15,
          guid: 'ec7bd17e-1d85-475d-ab36-416dae8f18f4',
          label: 'elit'
        },
        '12': {
          size: 3,
          sizeDecimal: 3.15,
          guid: 'bd72cb34-3801-4e9b-b41d-818dbfe1e88e',
          label: 'aute'
        },
        '96': {
          size: 28,
          sizeDecimal: 28.15,
          guid: '1e2a22b6-c95d-4359-82d2-d5d6d807de61',
          label: 'sit'
        },
        '41': {
          size: 24,
          sizeDecimal: 24.15,
          guid: '8f638ee5-c573-4f00-bc79-57c41318e1a0',
          label: 'minim'
        },
        '42': {
          size: 7,
          sizeDecimal: 7.15,
          guid: 'ba524759-4831-42e6-acf2-5c701194900e',
          label: 'non'
        },
        '73': {
          size: 24,
          sizeDecimal: 24.15,
          guid: '0fb8e8ee-203b-4754-bdf8-2349558bb17a',
          label: 'consequat'
        },
        '86': {
          size: 7,
          sizeDecimal: 7.15,
          guid: '2ef4822d-c461-488c-887b-43712383698b',
          label: 'anim'
        }
      }

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

describe('quicksort', function () {
  describe('getMedianOfThree', function () {
    const perms = [ [{idem: 0}, {idem: 1}, {idem: 2}],
                  [{idem: 0}, {idem: 2}, {idem: 1}],
                  [{idem: 1}, {idem: 0}, {idem: 2}],
                  [{idem: 1}, {idem: 2}, {idem: 0}],
                  [{idem: 2}, {idem: 0}, {idem: 1}],
                  [{idem: 2}, {idem: 1}, {idem: 0}] ]
        , correctAnswers = [1, 2, 0, 0, 2, 1]

    it('should find the location of 1', function () {
      for (const i in perms) {
        const foundMedian = quicksort._getMedianOfThree(perms[i], 'idem', 0, perms[i].length - 1)
        expect(foundMedian).toEqual(correctAnswers[i])
      }
    })
  })

  describe('quicksort', function () {
    it('should not sort a larger value before a smaller value', function () {
      const {sorted: sorted} = quicksort.quicksort(data, measure)
      expect(sorted.length).toEqual(data.length)
      for (let i = 0; i < sorted.length - 1; ++i) {
        if (sorted[i][measure] > sorted[i + 1][measure]) {
          fail(`size ${sorted[i][measure]} at index ${i} > ${sorted[i + 1][measure]} at index ${i + 1}`)
        }
      }
    })

    it('should not sort a smaller value before a larger value', function () {
      const {sorted: sorted} = quicksort.quicksort(data, measure, false)
      expect(sorted.length).toEqual(data.length)
      for (let i = 0; i < sorted.length - 1; ++i) {
        if (sorted[i][measure] < sorted[i + 1][measure]) {
          fail(`size ${sorted[i][measure]} at index ${i} < ${sorted[i + 1][measure]} at index ${i + 1}`)
        }
      }
    })
  })
})

describe('utils', function () {
  describe('toValuesArray', function () {
    it('should return arrays unchanged', function () {
      const array = [3, 9, 'Sunday', {'fruit': 'grape', 'grams': 500.4}, 86.144]
          , originalLength = array.length
          , processed = utils.toValuesArray(array)
      expect(processed === array).toBeTrue()
      expect(processed.length).toEqual(originalLength)
    })
    it('should return object\'s values', function () {
      const originalSize = Object.keys(obj1).length
          , processed = utils.toValuesArray(obj1)
      expect(Array.isArray(obj1)).toBeFalse()
      expect(Array.isArray(processed)).toBeTrue()
      expect(processed.length).toEqual(originalSize)
    })
  })

  describe('validate', function () {
    const array = [3, 9, 'Sunday', {'fruit': 'grape', 'grams': 500.4}, {'fruit': 'orange', 'grams': 1200}, 86.144]
    it('should should return an object with valid and invalid keys', function () {
      const result = utils.validate(array, obj => true)
      expect(result.valid).not.toBeUndefined()
      expect(result.invalid).not.toBeUndefined()
      expect(result.something).toBeUndefined()
      expect(result.valid.length).toEqual(array.length)
      expect(result.invalid.length).toEqual(0)
    })
    it('should find objects with a numeric \'grams\' property', function () {
      const result = utils.validate(array, utils.measureValidator.bind(null, 'grams'))
      expect(result.valid.length).toEqual(2)
      expect(result.invalid.length).toEqual(4)
      expect(result.valid[0].fruit).toEqual('grape')
      expect(result.invalid[result.invalid.length -1]).toEqual(86.144)
    })
  })
})
