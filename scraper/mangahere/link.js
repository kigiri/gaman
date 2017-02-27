const flow = require('izi/flow')
const map = require('izi/collection/map')
const fetch = require('node-fetch')
const { $, toText, mapGet, mapArr } = require('~/scraper/parse-utils')

const domain = 'http://www.mangahere.co'
const getDetails = flow(name => fetch(`${domain}/ajax/series.php`, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
    body: `name=${encodeURIComponent(name)}`,
  }),
  r => r.json(),
  mapArr({ 0: 'title', 5: 'author', 6: { key: 'year', fn: Number } }, String))

// fallback if tooltip info isn't available
const cleanup = flow.pipe(toText, txt => txt.slice(txt.indexOf(':') + 1).trim())

const getDetailsFallback = flow(mapGet('.detail_topText li', {
 2: { key: 'altNames', fn: cleanup },
 4: { key: 'author', fn: cleanup },
 5: { key: 'artist', fn: cleanup },
 8: { key: 'name', fn: flow.pipe($.h2, toText) },
}), ({ name, altNames, author, artist }) => [ name ]
  .concat(altNames.split('; '))
  .map(title => ({ title, author, artist })))

module.exports = {
  listUrl: `${domain}/mangalist`,
  path: 'a.manga_info',
  buildQueries: map(a => ({
    source: a.attribs.href.slice(30, -1),
    getQuery: () => getDetails(a.attribs.rel)
      .catch(err => getDetailsFallback(a.attribs.href)),
  })),
}
