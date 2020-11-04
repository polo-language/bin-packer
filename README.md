# bin-packer v1.0.0

Packs objects into bins of a specified maximum size.

Accepts either an array of objects or an ordinary object with object-valued properties. In the later case, the object's property keys are discarded before packing the property values, so if the keys are to be preserved (e.g. by storing on the values) this should be done prior to calling a bin packing algorithm.
Each value must have a uniformly named numeric sub-property giving the property's "size". Values with non-numeric sizes are returned as invalid (see Output). In particular, sizes encoded as strings must be converted beforehand.

## Install

```bash
npm install bin-packer
```

## bin-packer

### Methods

#### Arguments
- `obj`: The array or object whose own enumerable properties are to be binned.
- `measure`: The `string` name of the sub-property giving the size to bin on.
- `max`: The maximum bin size.

#### Output
Each algorithm returns an object with the following keys:
- `bins`: An array of arrays, each with total size less than or equal to `max`.
- `oversized`: An array containing any values which on their own have a size greather than `max`.
- `invalid`: An array containing any values with a non-object value or lacking the numeric `measure` property.

### Algorithms

#### nextFit(obj, measure, max)
Opens a new bin whenever a value doesn't fit in the latest one.

#### firstFit(obj, measure, max)
Tries to fit new items in all opened bins before opening a new one.

#### firstFitDecreasing(obj, measure, max)
Runs a sort first (so the hardest to place items are put down first), then uses firstFit.

### Utility method

#### quicksort(obj, measure, lowToHigh=true)
Sorts values by their `measure` property value. `lowToHigh` controls whether the result is sorted from smallest to largest or largest to smallest.


## Example
Example JSON input:
```json
[ { "size": 3.08,
    "label": "dolore"
  },
  { "size": 7.89,
    "label": "nulla"
  },
  { "size": 44.51,
    "OVERSIZED": "Size is larger than max.",
    "label": "nostrud"
  },
  { "size": 6.62,
    "label": "proident"
  },
  { "size": "8.05",
    "INVALID": "Invalid non-numeric size!",
    "label": "in"
  },
  { "etc": "..."
  },
  { "size": 5.56,
    "label": "nisi"
  }
]
```
Pack it into bins:
```js
const binPacker = require('../src/lib/bin-packer')
  //, data = JSON.parse(...)
    , result = binPacker.firstFitDecreasing(data, 'size', 10)

console.log("Bins: %O", result.bins)
console.log("Oversized: %O", result.oversized)
console.log("Invalid: %O", result.invalid)
```
Results in an array of bins:
```js
Bins: [
  [
    { size: 7.89, label: 'nulla' },
    { size: 0.79, label: 'consectetur' },
    { size: 0.13, label: 'fugiat' }
  ],
  [
    { size: 6.62, label: 'proident' },
    { size: 3.08, label: 'dolore' }
  ],
  [
    { size: 5.56, label: 'nisi' },
    { size: 2.88, label: 'eiusmod' }
  ],
  [ { size: 2.18, label: 'occaecat' } ]
]
Oversized: [ { size: 44.51, label: 'nostrud' } ]
Invalid: [ { size: '8.05', label: 'in' } ]
```

Using the quicksort utility:
```js
const sorted = binPacker.quicksort(data, measure)
console.log('Sorted: %O', sorted.sorted)
console.log("Invalid: %O", result.invalid)
```
Results in a sorted array of single-key objects:
```js
Sorted: [
  { size: 0.13, label: 'fugiat' },
  { size: 0.79, label: 'consectetur' },
  { size: 2.18, label: 'occaecat' },
  { size: 2.88, label: 'eiusmod' },
  { size: 3.08, label: 'dolore' },
  { size: 5.56, label: 'nisi' },
  { size: 6.62, label: 'proident' },
  { size: 7.89, label: 'nulla' },
  { size: 44.51, label: 'nostrud' }
]
Invalid: [ { size: '8.05', label: 'in' } ]
```
