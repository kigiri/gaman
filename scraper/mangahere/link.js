// mangalist/
const fetch = require('node-fetch')
const flow = require('izi/flow')
const map = require('izi/collection/map')
const { toText, raw } = require('~/scraper/parse-utils')

// specifics
const domain = 'http://www.mangahere.co'
const getDetails = flow(name => fetch('http://www.mangahere.co/ajax/series.php', {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
    body: `name=${encodeURIComponent(name)}`,
  }),
  r => r.json(),
  ([title,,,,, author, year]) => ({ title, author, year: Number(year) }))

module.exports = {
  listUrl: `${domain}/mangalist`,
  path: 'a.manga_info',
  buildQueries: map(a => ({
    source: a.attribs.href.slice(30),
    getQuery: () => getDetails(a.attribs.rel),
  })),
}

//buildQuery('/angel-onayami-soudanjo')
//serieSearch('Men\'s Love').then(console.log)

// 1 - get list
// listUrl
// path & parser
//  -> return { source, title }

// 2 - match 
//
