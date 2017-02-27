const flow = require('izi/flow')
const { $, $$, raw, toText } = require('izi/parkour')

const camelCase = require('lodash/camelCase')
const _path = flow.path('path')

const cleanCat = str => {
  const idx = str.search(/[^A-Za-z ]/)
  return (idx === -1) ? str : str.slice(0, idx)
}

const linkIds = el => $$.a(el)
  .map(el => el.attribs.href)
  .filter(Boolean)
  .map(href => href.split(/id=([0-9]+)/)[1])
  .filter(Boolean)
  .map(Number)

const allLines = el => el.children
  .filter(el => el.type === 'text')
  .map(toText)
  .filter(Boolean)

const num = el => Number(toText(el))
const bool = el => toText(el) === 'Yes'

const imgSrc = el => {
  const img = $.img(el)
  return img && img.attribs.src
}

const href = el => {
  const a = $.a(el)
  return a && a.attribs.href
}

const mapArr = (mapping, fallback) => arr => arr.reduce((result, val, i) => {
  const handler = mapping[i]
  if (!handler) return result
  const { key, fn } = handler
  result[key || handler] = fn ? fn(val) : (fallback || toText)(val)
  return result
}, {})

const get = path => flow(raw.all({ path }), _path)
const mapGet = (path, mapping) => flow(get(path), mapArr(mapping))

module.exports = {
  $,
  $$,
  get,
  raw,
  num,
  bool,
  href,
  imgSrc,
  toText,
  mapGet,
  mapArr,
  linkIds,
  allLines,
  cleanKey: el => camelCase(cleanCat(toText(el))),
}