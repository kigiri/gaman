const f = require('izi/flow')
const map = require('izi/collection/map')
const fetch = require('node-fetch')
const { match } = require('izi/str')
const { unique } = require('izi/arr')
const { Array: { reverse, join } } = require('izi/proto')
const { raw, toText } = require('~/scraper/parse-utils')

const domain = 'http://mngcow.co/'

module.exports = {
  listUrl: `${domain}manga-list`,
  path: '#wpm_mng_lst .det > a',
  teamId: 5217,
  buildQueries: map(a => ({
    source: a.attribs.href.slice(17, -1),
    getQuery: () => Promise.resolve({ title: a.attribs.title }),
  })),
  chapters: f([
    f.hold.both(f([
      ref => `${domain}${ref}`,
      raw('ul.mng_chp a.lst'),
      f.path('attribs.href'),
      raw.all('select.cbo_wpm_chp option'),
      reverse,
      map(f.path('attribs.value')),
    ])),
    ([ ref, values ]) => values.map((value, index) => ({
      index,
      chapter: Number(value),
      uri: `${domain}${ref}/${value}`,
    })),
  ]),
  images: f([
    fetch,
    f.exec('text'),
    match.cook(/http:\/\/mngcow\.co\/wp-content\/manga\/\d[^"]+/g),
    unique,
  ]),
}
