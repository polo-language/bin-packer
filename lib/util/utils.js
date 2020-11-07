module.exports = {
  toIterable: toIterable,
  validate,
  measureValidator,
}

/**
 * Converts the argument to an interable if it is not one already.
 * In particular, if it is a non-iterable object, returns an array of the object's own innumerable property values.
 * @param {iterable|object} obj
 */
function toIterable(obj) {
  if (obj !== null) {
    if (typeof obj[Symbol.iterator] === 'function') {
      return obj
    } else if (typeof obj === 'object') {
      return Object.values(obj)
    }
  }
  throw new Error('Must be either iterable or a non-function object')
}

/**
 * Sorts the array values into two arrays according to the result of applying the {@param validator} function.
 * @param {function} validator    A function from object => boolean.
 * @returns   An object with a 'valid' array property and an 'invalid' array property.
 */
function validate(array, validator) {
  const valid = []
    , invalid = []
  for (const value of array) {
    if (validator(value)) {
      valid.push(value)
    } else {
      invalid.push(value)
    }
  }
  return {'valid': valid, 'invalid': invalid}
}

/**
 * Use as a function of a single variable with bind like so:
 * @example
 * measureValidator.bind(null, measure)
 * @param {string} measure The numeric property name
 * @param {object} obj      The object to validate
 */
function measureValidator(measure, obj) {
  return obj !== null && typeof obj === 'object' && typeof obj[measure] === 'number'
}
