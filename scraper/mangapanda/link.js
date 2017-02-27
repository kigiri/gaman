// http://www.mangapanda.com/alphabetical

const flow = require('izi/flow')
const map = require('izi/collection/map')
const { toText, raw } = require('~/scraper/parse-utils')

// specifics
const domain = 'http://www.mangapanda.com'
const toElasticSearchQuery = ({ name, year }) => ({
  bool: {
    should: [
      { title: { query: name,  boost: 1000 } },
      { associatedNames: name },
      year && ({ year: { query: year, boost: 500 } }),
    ].filter(Boolean).map(match => ({ match }))
  }
})

const fetchQuery = flow(source => `${domain}${source}`, raw.all({
  props: '#mangaproperties td:nth-child(even)'
}), ({ props }) => {
  const [ originalName, altNames, year ] = toText(props.slice(0, 3))

  console.log(`query for ${originalName} builded`)

  return [ originalName ].concat(altNames.split(', '))
    .map(name => toElasticSearchQuery({ name, year: Number(year) }))
})

const buildQuery = source => () => fetchQuery(source)
  .then(queries => ({ queries, source }))

module.exports = {
  listUrl: `${domain}/alphabetical`,
  path: 'ul.series_alpha a',
  buildQueries: map(flow.pipe(flow.path('attribs.href'), buildQuery)),
}

//buildQuery('/angel-onayami-soudanjo')
//serieSearch('Men\'s Love').then(console.log)

// 1 - get list
// listUrl
// path & parser
//  -> return { source, title }

// 2 - match 
//
