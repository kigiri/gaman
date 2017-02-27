// http://www.mangapanda.com/alphabetical

const fetch = require('node-fetch')
const flow = require('izi/flow')
const { isArr, isStr } = require('izi/is')
const filter = require('izi/collection/filter')
const merge = require('izi/collection/merge')
const map = require('izi/collection/map')
const db = require('~/db')
const { toText, raw } = require('~/scraper/parse-utils')

const sort = fn => arr => arr.sort(fn)
const first = flow.path('0')
const _id = flow.path('_id')
const _score = flow.path('_score')

const sortByScore = sort((a, b) => _score(b) - _score(a))
const stupidMemo = fn => (c => k => c[k] || (c[k] = fn(k)))(Object.create(null))

const getAuthorId = stupidMemo(flow(name => [
  { name: { query: name,  boost: 1000 } },
  { originalName: { query: name,  boost: 1000 } },
  { associatedNames: name },
], db.author.search.stupid, _id))

const matchAuthor = opts => {
  isStr(opts.author) && (opts.author = getAuthorId(opts.author))
  isStr(opts.artist) && (opts.artist = getAuthorId(opts.artist))

  return flow.all(opts)
}

const findSerie = flow(matchAuthor, ({ title, year, author, artist }) => [
  { title: { query: title,  boost: 1000 } },
  { associatedNames: title },
  author && ({ author: { query: author, boost: 500 } }),
  artist && ({ artist: { query: artist, boost: 500 } }),
  year && ({ year: { query: year, boost: 500 } }),
].filter(Boolean), db.serie.search.stupid)

const findBestSerie = flow([
  val => isArr(val) ? val : [ val ],
  map(findSerie),
  flow.all,
  flow(sortByScore, first)
])

const findSource = (sourceName, source) => 
  db.serie.search.stupid({ [sourceName]: source })

const fetchId = sourceName => {
  const getSource = flow.path(['_source', sourceName ])

  return map(({ source, getQuery }) => () => findSource(sourceName, source)
    // I first check if i don't have already set this serie
    .then(match => (match && match._id) || getQuery()
      .then(findBestSerie)
      .then(ret => {
        if (!ret) return

        const { _id, _source } = ret
        if (getSource(ret) === source) return _id

        return db.serie.put(_id, merge(_source, { [sourceName]: source }))
          .then(ret => ret.result === 'updated' ? ret._id : undefined)
      }))
    .catch(console.log)
    .then(_id => (console.log(`${_id ? ('#'+_id) : 'Not found !'} ${sourceName}: ${source}`),
      !_id && source)))
}

const filterEmpty = filter(Boolean)
module.exports = (sourceName, { listUrl, path, buildQueries }) => {
  const serieList = raw.all({ path })
  const linkIds = flow(fetchId(`${sourceName}Ref`), flow.serie.workers(2))

  return serieList(listUrl)
    .then(ret => buildQueries(ret.path))
    .then(linkIds)
    .then(filterEmpty)
}


// arr { source, getQuery }