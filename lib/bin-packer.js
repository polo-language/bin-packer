'use strict'

const fitAlgos = require('./fit-algos')
const binCompletion = require('./bin-completion')
const bounds = require('./bounds')

module.exports = {
  nextFit: fitAlgos.nextFit,
  firstFit: fitAlgos.firstFit,
  firstFitDecreasing: fitAlgos.firstFitDecreasing,
  bestFitDecreasing: fitAlgos.bestFitDecreasing,
  binCompletion: binCompletion.binCompletion,
  lowerBound1: bounds.lowerBound1,
  lowerBound2: bounds.lowerBound2,
}
