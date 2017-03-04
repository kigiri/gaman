const linker = require('~/scraper/linker')
const flow = require('izi/flow')
const map = require('izi/collection/map')
const storeObj = require('izi/collection/store').obj
const { toSnake } = require('izi/str')

const fetchAll = flow([
  map(src => () => linker(src, require(`~/scraper/${toSnake(src)}/link`))),
  flow.serie.workers(3),
])

module.exports = storeObj((acc, src) => {
  const srcPath = `~/scraper/${toSnake(src)}/`
  const link = require(`${srcPath}/link`)
  acc[src] = {
    link: () => linker(src, link),
  }
}, [
  'mangapanda',
  'mangareader',
  'mangahere',
  'mangastream',
  'mangafox',
  'mangacow',
  'lineWebtoon',
  'egscans',
], {})