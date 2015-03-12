# bin-packer v0.0.1

Collection of methods to pack an object's properties into an array of uniform sized bins.

Each property of the object must have a numeric sub-property with the a uniform name that identifies the property's "size".

## Install

```bash
npm install bin-packer
```

## bin-packer

### Methods

#### nextFit(obj, measure, max, addOversize)
`obj` is the object whose properties are to be binned.
`measure` is a `string` identifying the name of the sub-property 

#### firstFit(obj, measure, max /*, addOversize*/)


## Example

```js
TODO
```