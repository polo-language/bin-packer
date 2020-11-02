# bin-packer v1.0.0

Pack an object's properties into an array of uniform sized bins.

Each property of the object must have a uniformly named numeric sub-property giving the property's "size". The size value must be a number: values encoded as strings must be converted prior to passing to one of the algorithms.

## Install

```bash
npm install bin-packer
```

## bin-packer

### Methods

#### Arguments
- `obj`: The object whose own enumerable properties are to be binned.
- `measure`: The `string` name of the sub-property giving the size to bin on.
- `max`: The maximum bin size.

#### Output
Each algorithm returns an object with the following keys:
- `bins`: An array of objects each with total size less than or equal to `max`.
- `oversized`: An object containing any properties which alone have a size greather than `max`.
- `invalid`: An object containing any properties with a non-object value or with a missing numeric `measure` property.

### Algorithms

#### nextFit(obj, measure, max, addOversize)
Naive algorithm: Opens a new bin whenever a file doesn't fit in the latest one.

#### firstFit(obj, measure, max, addOversize)
Better: Tries to fit new items in all opened bins before opening a new one.

#### firstFitDecreasing(obj, measure, max, addOversize)
Even better: Runs a sort first so the hardest to place items are put down first.

### Utility method

#### quicksortObj(obj, measure)
Sorts the keys of `obj` on the value of the numeric property given by the string `measure`. An array of single-key objects is returned.


## Example
Some JSON input:
```json
{ "0": { "size": 58,
         "att": 0.35 },
  "1": { "size": 36,
         "att": 0.33 },
  "2": { "size": 31,
         "att": 0.49 },
  "3": { "size": 7,
         "att": 0.53 },
  "4": { "size": 76,
         "att": 0.25 },
  "5": { "size": 47,
         "att": 0.07 },
  "etc": "..."
}
```
Pack it into bins:
```js
const binPacker = require('bin-packer')
//, data = ...
  , max = 300
  , measure = 'size'
  , result = binPacker.firstFitDecreasing(JSON.parse(data), measure, max)

console.log(result.bins)
```
Results in an array of bins:
```js
[ { '7': { size: 90, att: 0.99 },
    '10': { size: 10, att: 0.35 },
    '12': { size: 90, att: 0.43 },
    '14': { size: 8, att: 0.08 },
    '16': { size: 1, att: 0.43 },
    '24': { size: 98, att: 0.72 } },
  { '5': { size: 47, att: 0.07 },
    '6': { size: 83, att: 0.21 },
    '8': { size: 87, att: 0.39 },
    '11': { size: 81, att: 0.63 } },
  { '4': { size: 76, att: 0.25 },
    '15': { size: 73, att: 0.69 },
    '17': { size: 76, att: 0.4 },
    '22': { size: 75, att: 0.76 } },
//    ...
]
```

Using the quicksort utility:
```js
const result = binPacker.quicksortObj(data, measure)
console.log(result.sorted)
```
Results in a sorted array of single-key objects:
```js
[ { '16': { size: 1, att: 0.43 } },
  { '3': { size: 7, att: 0.53 } },
  { '14': { size: 8, att: 0.08 } },
  { '10': { size: 10, att: 0.35 } },
  { '20': { size: 25, att: 0.98 } },
  { '2': { size: 31, att: 0.49 } },
  { '1': { size: 36, att: 0.33 } },
  { '23': { size: 39, att: 0.23 } },
//    ...
]
```