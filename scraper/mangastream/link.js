const flow = require('izi/flow')
const map = require('izi/collection/map')
const filter = require('izi/collection/filter')
const { toText, mapGet, num } = require('~/scraper/parse-utils')
const db = require('~/db')

const domain = 'http://www.mangastream.com'

module.exports = {
  listUrl: `${domain}/manga`,
  path: 'table tr strong > a',
  teamId: 3205,
  buildQueries: map(a => ({
    source: a.attribs.href.slice(29),
    getQuery: () => Promise.resolve({ title: toText(a) }),
  })),
}

