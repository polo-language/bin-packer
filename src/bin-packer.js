'use strict'

const fitAlgos = require('./fit-algos')
const binCompletion = require('./bin-completion')
const bounds = require('./bounds')

// Approximate solution algorithms
exports.nextFit = fitAlgos.nextFit
exports.firstFit = fitAlgos.firstFit
exports.firstFitDecreasing = fitAlgos.firstFitDecreasing
exports.bestFitDecreasing = fitAlgos.bestFitDecreasing

// Exact solution algorithms
exports.binCompletion = binCompletion.binCompletion

// Lower bounds
exports.lowerBound1 = bounds.lowerBound1
exports.lowerBound2 = bounds.lowerBound2
