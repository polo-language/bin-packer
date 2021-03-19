'use strict'

const fitAlgos = require('./fit-algos')
const fitVarCapAlgos = require('./fit-variable-capacity')
const binCompletion = require('./bin-completion')
const bounds = require('./bounds')

// Approximate solution algorithms
exports.nextFit = fitAlgos.nextFit
exports.firstFit = fitAlgos.firstFit
exports.firstFitDecreasing = fitAlgos.firstFitDecreasing
exports.bestFitDecreasing = fitAlgos.bestFitDecreasing

// Variable capacity bins
exports.nextFitVarCap = fitVarCapAlgos.nextFitVarCap

// Exact solution algorithms
exports.binCompletion = binCompletion.binCompletion

// Lower bounds
exports.lowerBound1 = bounds.lowerBound1
exports.lowerBound2 = bounds.lowerBound2
