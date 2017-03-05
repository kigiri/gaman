const f = require('izi/flow')
const { isArr, isStr, isFn } = require('izi/is')
const filter = require('izi/collection/filter')
const reduce = require('izi/collection/reduce')
const merge = require('izi/collection/merge')
const map = require('izi/collection/map')
const db = require('~/db')
const { sort } = require('izi/arr')
const { toText, raw } = require('~/scraper/parse-utils')
const stupidMemo = require('izi/stupid-memo')

const first = f.path('0')
const _id = f.path('_id')
const _score = f.path('_score')

const sortByScore = sort((a, b) => _score(b) - _score(a))
const filterEmpty = filter(Boolean)
const getAuthorId = stupidMemo(f(name => [
  { name: { query: name,  boost: 1000 } },
  { originalName: { query: name,  boost: 1000 } },
  { associatedNames: name },
], db.author.search.stupid, _id))

const matchAuthor = opts => {
  isStr(opts.author) && (opts.author = getAuthorId(opts.author))
  isStr(opts.artist) && (opts.artist = getAuthorId(opts.artist))

  return f.all(opts)
}

const findSource = (srcKey, source) => 
  db.serie.search.stupid({ [srcKey]: source })

const toArr = arr => isArr(arr) ? arr : [ arr ]
const filterAllEmpty = f.pipe(toArr, map(filterEmpty))
const callIfFn = fn => isFn(fn) ? fn() : fn
const retryIfEmpty = f.pipe(toArr, reduce((q, next) => callIfFn(q)
  .then(filterAllEmpty)
  .then(res => Object.keys(res).length ? res : next(), next)))

const fetchId = (srcKey, teamId) => {
  const getSource = f.path(['_source', srcKey ])

  const ids = teamId ? db.group.getSeries(teamId) : Promise.resolve()
  const getSerie = query => ids.then(_id => db.serie.search.stupid(query, _id))

  const findSerie = f(matchAuthor, ({ title, year, author, artist }) => [
    { title: { query: title,  boost: 1000 } },
    { associatedNames: title },
    author && ({ author: { query: author, boost: 500 } }),
    artist && ({ artist: { query: artist, boost: 500 } }),
    year && ({ year: { query: year, boost: 500 } }),
  ].filter(Boolean), getSerie)

  const findBestSerie = f(toArr, map(findSerie), f.all, f(sortByScore, first))

  return map(({ source, getQuery }) => () => findSource(srcKey, source)
    // I first check if i don't have already set this serie
    .then(match => (match && match._id) || retryIfEmpty(getQuery)
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
  const linkIds = f(fetchId(srcKey, teamId),
    f.serie.workers(2))

  return serieList(listUrl)
    .then(ret => buildQueries(ret.path))
    .then(linkIds)
    .then(filterEmpty)
}

const mergeTitle = ({ title, associatedNames }) => [ title, ...associatedNames ]
const retryIfNotFound = reduce((q, next) => callIfFn(q)
  .catch(err => /not found/.test(err.message) ? next() : Promise.reject(err)))

const getSerieDataFromGroupId = f([
  db.group.getSeries,
  map(f.lazy(db.serie.get)),
  f.serie.workers(15),
])

const fromRelease = (srcKey, { teamId, findRef, spamRate }) =>
  getSerieDataFromGroupId(teamId)
    .then(map(({ _id, _source }) => () => (_source[srcKey])
      ? console.log(`#${_id} ${_source.title} -> ${_source[srcKey]}`)
      : retryIfNotFound(mergeTitle(_source).map(f.lazy(findRef)))
        .then(ref => db.serie.put(_id, merge(_source, { [srcKey]: ref }))
          .then(() => console.log(`#${_id} ${_source.title} -> ${ref}`))
        .catch(() => {
          console.log(`ERR: #${_id} ${mergeTitle(_source).join(', ')}`)
          return _source.title
        }))))
    .then(f.serie.workers(spamRate || 2))
    .then(filterEmpty)

module.exports = (sourceName, props) => (props.findRef
  ? fromRelease
  : fromScrap)(`${sourceName}Ref`, props)
