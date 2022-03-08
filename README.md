# bin-packer

Packs objects into bins of a specified capacity.
Repacking algorithms have been moved to [bin-repacker](https://github.com/polo-language/bin-repacker).

## Install

```bash
npm install bin-packer
```

## bin-packer

### Methods

#### Arguments
- `obj`: The array or object whose own enumerable property values are to be binned (property keys 
are discarded). Modifies `obj`, though not its values, if it is an array, so pass in a shallow 
copy if you want to preserve the original.
- `sizeOf`: A function from items in `obj` to their numerical sizes. Will be called multiple times 
on each item by most algorithms. So if this would be an expensive operation, it is advisable to 
supply a function that returns the memoized value.
- `capacity`: The maximum bin size.

### Algorithms
Each algorithm returns an object with the following keys:
- `bins`: An array of arrays, each containing elements with total size less than or equal to 
`capacity`.
- `oversized`: An array containing any elements which on their own have a size greater than 
`capacity`.

#### nextFit(obj, sizeOf, capacity)
Opens a new bin whenever a value doesn't fit in the latest one.

#### firstFit(obj, sizeOf, capacity)
Tries to fit new items sequentially in all opened bins before opening a new one.

#### firstFitDecreasing(obj, sizeOf, capacity)
Runs a sort, so the hardest to place items are placed first, then uses First Fit.

#### bestFitDecreasing(obj, sizeOf, capacity)
Sorts items largest to smallest like First Fit Decreasing and then places each one in the fullest 
bin into which it will fit. Best Fit Decreasing should generally be preferred to First Fit and 
First Fit Decreasing since the Best Fit algorithm uses binary search to find the target bin for 
each item rather than First Fit's linear search and is considerably faster.

#### binCompletion(obj, sizeOf, capacity)
Korf's Bin Completion algorithm for producing an optimal solution. Warning! Bin packing is an 
NP-hard problem. Time and resource consumption may be high.

### Bounds
Each bound function returns an object with the following keys:
- `bound`: A lower bound on the number of bins required by an optimal solution.
- `oversized`: The number of oversized items.

#### lowerBound1(obj, sizeOf, capacity)
Simple to compute: the number of bins required if elements' sizes could be split across bins to 
fill each completely before opening a new one.

#### lowerBound2(obj, sizeOf, capacity)
Martello and Toth's L2 lower bound on the number of bins required by an optimal solution. Combines 
the methodology of the L1 lower bound with the addition of a 'waste' component for each bin that 
can be shown not to be fully fillable.

## Example
Example JSON input:
```json
[ { "size": 3.08, "label": "dolore" },
  { "size": 7.89, "label": "nulla" },
  { "size": 44.51, "label": "nostrud", "OVERSIZED": "Size is larger than capacity." },
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
    , capacity = 10
    , result = binPacker.bestFitDecreasing(data.slice(), sizeOf, capacity)

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
  { size: 44.51, label: 'nostrud', OVERSIZED: 'Size is larger than capacity.' }
]
```
