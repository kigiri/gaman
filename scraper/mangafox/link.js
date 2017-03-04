const f = require('izi/flow')
const map = require('izi/collection/map')
const fetch = require('node-fetch')
const proto = require('izi/proto')
const { $, toText, raw, mapGet, mapArr } = require('~/scraper/parse-utils')

const domain = 'http://mangafox.me'
const spreadNames = ({ name, altNames, author, artist, year }) => (altNames
  ? altNames.split('; ').concat([ name ])
  : [ name ]).map(title => ({ title, author, artist, year }))

const getDetails = f([
  sid => fetch(`${domain}/ajax/series.php`, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
    body: `sid=${sid}`,
  }),
  r => r.json(),
  mapArr({
    0: 'name',
    1: 'altNames',
    3: 'author',
    4: 'artist',
    8: { key: 'year', fn: Number }
  }, String),
  spreadNames,
])

// fallback if tooltip info isn't available
const cleanup = f.pipe(toText, txt => txt.slice(txt.indexOf(':') + 1).trim())
const getDetailsFallback = f(mapGet('.detail_topText li', {
 2: { key: 'altNames', fn: cleanup },
 4: { key: 'author', fn: cleanup },
 5: { key: 'artist', fn: cleanup },
 8: { key: 'name', fn: f.pipe($.h2, toText) },
}), spreadNames)

const parseChapterNum = f.pipe([
  toText,
  str => str.slice(str.lastIndexOf(' ')),
  Number,
])

module.exports = {
  listUrl: `${domain}/manga`,
  path: 'manga_list li',
  buildQueries: map(a => ({
    source: a.attribs.href.slice(25, -1),
    getQuery: () => getDetails(a.attribs.rel)
      .catch(err => getDetailsFallback(a.attribs.href)),
  })),
  chapters: f([
    ref => `${domain}/manga/${ref}`,
    raw.all('.chlist h3, .chlist h4'),
    proto.Array.reverse,
    map((el, index) => {
      const [ , a,, span ] = el.children

      return {
        index,
        uri: a.attribs.href,
        title: toText(span),
        chapter: parseChapterNum(a),
      }
    })
  ])
}


module.exports.chapters('onepunch_man')
  .then(console.log)