const flow = require('izi/flow')
const { isArr, isStr, isFn } = require('izi/is')
const filter = require('izi/collection/filter')
const reduce = require('izi/collection/reduce')
const merge = require('izi/collection/merge')
const map = require('izi/collection/map')
const db = require('~/db')
const { sort } = require('izi/arr')
const { toText, raw } = require('~/scraper/parse-utils')
const stupidMemo = require('izi/stupid-memo')

const first = flow.path('0')
const _id = flow.path('_id')
const _score = flow.path('_score')

const sortByScore = sort((a, b) => _score(b) - _score(a))
const filterEmpty = filter(Boolean)
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

const findSource = (srcKey, source) => 
  db.serie.search.stupid({ [srcKey]: source })

const fetchId = (srcKey, teamId) => {
  const getSource = flow.path(['_source', srcKey ])

  const ids = teamId ? db.group.getSeries(teamId) : Promise.resolve()
  const getSerie = query => ids.then(_id => db.serie.search.stupid(query, _id))

  const findSerie = flow(matchAuthor, ({ title, year, author, artist }) => [
    { title: { query: title,  boost: 1000 } },
    { associatedNames: title },
    author && ({ author: { query: author, boost: 500 } }),
    artist && ({ artist: { query: artist, boost: 500 } }),
    year && ({ year: { query: year, boost: 500 } }),
  ].filter(Boolean), getSerie)

  const findBestSerie = flow([
    val => isArr(val) ? val : [ val ],
    map(findSerie),
    flow.all,
    flow(sortByScore, first)
  ])

  return map(({ source, getQuery }) => () => findSource(srcKey, source)
    // I first check if i don't have already set this serie
    .then(match => (match && match._id) || getQuery()
      .then(findBestSerie)
      .then(ret => {
        if (!ret) return

        const { _id, _source } = ret
        if (getSource(ret) === source) return _id

        return db.serie.put(_id, merge(_source, { [srcKey]: source }))
          .then(ret => ret.result === 'updated' ? ret._id : undefined)
      }))
    .catch(console.log)
    .then(_id => (console.log(`${_id
      ? ('#'+_id)
      : 'Not found !'} ${srcKey}: ${source}`), !_id && source)))
}

const fromScrap = (srcKey, { listUrl, path, buildQueries, teamId }) => {
  const serieList = raw.all({ path })
  const linkIds = flow(fetchId(srcKey, teamId),
    flow.serie.workers(2))

  return serieList(listUrl)
    .then(ret => buildQueries(ret.path))
    .then(linkIds)
    .then(filterEmpty)
}

const mergeTitle = ({ title, associatedNames }) => [ title, ...associatedNames ]
const fetchAndRetry = reduce((q, fetchTitle) => (isFn(q) ? q() : q)
  .catch(err => /not found/.test(err.message)
    ? fetchTitle()
    : Promise.reject(err)))

const getSerieDataFromGroupId = flow([
  db.group.getSeries,
  map(flow.lazy(db.serie.get)),
  flow.serie.workers(15),
])

const fromRelease = (srcKey, { teamId, findRef, spamRate }) =>
  getSerieDataFromGroupId(teamId)
    .then(map(({ _id, _source }) => () => (_source[srcKey])
      ? console.log(`#${_id} ${_source.title} -> ${_source[srcKey]}`)
      : fetchAndRetry(mergeTitle(_source).map(flow.lazy(findRef)))
        .then(ref => db.serie.put(_id, merge(_source, { [srcKey]: ref }))
          .then(() => console.log(`#${_id} ${_source.title} -> ${ref}`))
        .catch(() => {
          console.log(`ERR: #${_id} ${mergeTitle(_source).join(', ')}`)
          return _source.title
        }))))
    .then(flow.serie.workers(spamRate || 2))
    .then(filterEmpty)

module.exports = (sourceName, props) => (props.findRef
  ? fromRelease
  : fromScrap)(`${sourceName}Ref`, props)
