# bin-packer v0.1.2

Collection of methods to pack an object's properties into an array of uniform sized bins.

Each property of the object must have a uniformly named numeric sub-property with that gives the property's "size".

## Install

```bash
npm install bin-packer
```

## bin-packer

### Methods

#### Arguments:
- `obj` is the object whose properties are to be binned.

- `measure` is the `string` name of the sub-property giving the size to bin on.

- `max` is the size of each bin.

- `addOversize` defaults to `true`: any item larger than the size given by `max` is added to its own "oversized" bin at the tail of the returned array. If set to `false`, the last bin in the returned array contains an object with all of the oversized elements - note that in this case if there are no oversized elements, an empty object is appended to the array for consistency.

#### Return value:
An array of objects of the binned properties.

### Algorithms:

#### nextFit(obj, measure, max, addOversize)

Naive algorithm: Opens a new bin whenever a file doesn't fit in the latest one.

#### firstFit(obj, measure, max, addOversize)

Better: Tries to fit new items in all opened bins before opening a new one.

#### firstFitDecreasing(obj, measure, max, addOversize)

Even better: Runs a sort first so the hardest to place items are put down first.


## Example

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

```js
var bp = require('bin-packer')
//, data = ...
  , max = 300
  , bins = bp.firstFitDecreasing(JSON.parse(data), 'size', max, false)
  , oversized = bins.pop()

console.log(bins)
```
Gives this:
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
