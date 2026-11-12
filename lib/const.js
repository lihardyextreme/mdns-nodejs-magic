const TYPE_NAMES = Object.freeze({
  1: 'TYPE_A',
  12: 'TYPE_PTR',
  16: 'TYPE_TXT',
  28: 'TYPE_AAAA',
  33: 'TYPE_SRV',
  255: 'TYPE_ANY',
})

module.exports = Object.freeze({
  TYPE_A: 1,
  TYPE_PTR: 12,
  TYPE_TXT: 16,
  TYPE_AAAA: 28,
  TYPE_SRV: 33,
  TYPE_ANY: 255,
  TYPE_NAMES,
})
