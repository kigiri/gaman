const { $, $$, raw, toText } = require('izi/parkour')

const camelCase = require('lodash/camelCase')

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


module.exports = {
  $,
  $$,
  raw,
  num,
  bool,
  href,
  imgSrc,
  toText,
  linkIds,
  allLines,
  cleanKey: el => camelCase(cleanCat(toText(el))),
}