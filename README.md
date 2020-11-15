# bin-packer v1.2.0

Packs objects into bins of a specified maximum size.

## Install

```bash
npm install bin-packer
```

## bin-packer

### Methods

#### Arguments
- `obj`: The array or object whose own enumerable property values are to be binned (property keys are discarded).
- `sizeOf`: A function from items in `obj` to a numerical size.
- `max`: The maximum bin size.

#### Output
Each algorithm returns an object with the following keys:
- `bins`: An array of arrays, each with total size less than or equal to `max`.
- `oversized`: An array containing any values which on their own have a size greather than `max`.

### Algorithms

#### nextFit(obj, sizeOf, max)
Opens a new bin whenever a value doesn't fit in the latest one.

#### firstFit(obj, sizeOf, max)
Tries to fit new items sequentially in all opened bins before opening a new one.

#### firstFitDecreasing(obj, sizeOf, max)
Runs a sort, so the hardest to place items are placed first, then uses First Fit.

#### bestFitDecreasing(obj, sizeOf, max)
Sorts items largest to smallest like First Fit Decreasing and then places each one in the most full bin into which it will fit. Best Fit Decreasing should generally be preferred to First Fit and First Fit Decreasing since the Best Fit algorithm uses binary search to find the target bin for each item rather than First Fit's linear search and is considerably faster.

### Utility method

#### quicksort(obj, sizeOf, lowToHigh=true)
Sorts values by their size given by `sizeOf`. `lowToHigh` controls whether the result is sorted from smallest to largest or largest to smallest.


## Example
Example JSON input:
```json
[ { "size": 3.08, "label": "dolore" },
  { "size": 7.89, "label": "nulla" },
  { "size": 44.51, "label": "nostrud", "OVERSIZED": "Size is larger than max." },
  { "size": 6.62, "label": "proident" },
  { "size": 2.07, "label": "occaecat" },
  { "size": 0.79, "label": "consectetur" },
  { "size": 8.05, "label": "in" },
  { "size": 0.13, "label": "fugiat" },
  { "size": 2.88, "label": "eiusmod" },
  { "size": 5.56, "label": "nisi" }
]
```
Pack it into bins:
```js
const binPacker = require('bin-packer')
  //, data = JSON.parse(...)
    , sizeOf = item => item['size']
    , result = binPacker.bestFitDecreasing(data.slice(), sizeOf, 10)

console.log("Bins: %O", result.bins)
console.log("Oversized: %O", result.oversized)
```
Results in an array of bins:
```js
Bins: [
  [
    { size: 7.89, label: 'nulla' },
    { size: 2.07, label: 'occaecat' }
  ],
  [
    { size: 6.62, label: 'proident' },
    { size: 3.08, label: 'dolore' },
    { size: 0.13, label: 'fugiat' }
  ],
  [
    { size: 5.56, label: 'nisi' },
    { size: 2.88, label: 'eiusmod' },
    { size: 0.79, label: 'consectetur' }
  ],
  [ { size: 8.05, label: 'in' } ]
]
Oversized: [
  { size: 44.51, label: 'nostrud', OVERSIZED: 'Size is larger than max.' }
]
```

Using the quicksort utility:
```js
console.log(binPacker.quicksort(data.slice(), sizeOf))
```
Results in a sorted array:
```js
[
  { size: 0.13, label: 'fugiat' },
  { size: 0.79, label: 'consectetur' },
  { size: 2.07, label: 'occaecat' },
  { size: 2.88, label: 'eiusmod' },
  { size: 3.08, label: 'dolore' },
  { size: 5.56, label: 'nisi' },
  { size: 6.62, label: 'proident' },
  { size: 7.89, label: 'nulla' },
  { size: 8.05, label: 'in' },
  { size: 44.51, label: 'nostrud', OVERSIZED: 'Size is larger than max.' }
]
```
