const flow = require('izi/flow')
const map = require('izi/collection/map')
const { toText, mapGet, num } = require('~/scraper/parse-utils')

const domain = 'http://www.mangareader.net'
const expandNames = ({ name, altNames, year, author, artist  }) => [ name ]
  .concat(altNames.split(', '))
  .map(title => ({ title, year, author, artist }))

const getDetails = flow(source => `${domain}${source}`,
  mapGet('#mangaproperties td:nth-child(even)', {
    0: 'name',
    1: 'altNames',
    2: { key: 'year', fn: num },
    4: 'author',
    5: 'artist',
  }), expandNames)

module.exports = {
  listUrl: `${domain}/alphabetical`,
  path: 'ul.series_alpha a',
  buildQueries: map(a => ({
    source: a.attribs.href.slice(1),
    getQuery: () => getDetails(a.attribs.href),
  })),
}
