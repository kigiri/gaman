const flow = require('izi/flow')
const map = require('izi/collection/map')
const { toText, raw } = require('~/scraper/parse-utils')

const domain = 'http://www.mangapanda.com'
const getDetails = flow(source => `${domain}${source}`, raw.all({
  props: '#mangaproperties td:nth-child(even)'
}), ({ props }) => {
  const [ name, altNames, year,, author, artist ] = toText(props)

  return [ name ].concat(altNames.split(', '))
    .map(title => ({ title, year: Number(year), author, artist }))
})

module.exports = {
  listUrl: `${domain}/alphabetical`,
  path: 'ul.series_alpha a',
  buildQueries: map(a => ({
    source: a.attribs.href.slice(1),
    getQuery: () => getDetails(a.attribs.href),
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
