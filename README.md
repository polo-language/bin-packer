# bin-packer v0.0.1

Collection of methods to pack an object's properties into an array of uniform sized bins.

Each property of the object must have a uniformly named numeric sub-property with that gives the property's "size".

## Install

```bash
npm install bin-packer
```

## bin-packer

### Methods

#### Arguments:
`obj` is the object whose properties are to be binned.

`measure` is the `string` name of the sub-property giving the size to bin on.

`max` is the size of each bin.

`addOversize` defaults to `true`: any item larger than the size given by `max` is added to its own "oversized" bin at the tail of the returned array. If set to `false`, the last bin in the returned array contains an object with all of the oversized elements.

#### Return value:
An array of objects of the binned properties.

### Algorithms:

#### nextFit(obj, measure, max, addOversize)

#### firstFit(obj, measure, max, addOversize)


## Example

```json
{
  "alpha": { "size": 58, "anotherProperty": 0.35 },
  "beta": { "size": 36, "anotherProperty": 0.33, "stuff": "note" },
  "gamma": { "size": 31, "anotherProperty": 0.49, "arr": [0, 1, 42] }
  "etc": { "size": 71.623 }
}
```

```js
var require('bin-packer')
  , bins = binPacker.firstFit(JSON.parse(data), 'size', 75, false)
  , oversized = bins.pop()
```