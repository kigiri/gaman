const oops = require('izi/oops')
const flow = require('izi/flow')
const map = require('izi/collection/map')
const filter = require('izi/collection/filter')
const { isArr } = require('izi/is')
const YoRedis = require('yoredis')
const redis = new YoRedis({ url: 'redis://91.121.220.177:6379' })

global.fetch = require('node-fetch') // poly fetch
const apiBuilder = require('izi/api-builder')
const esdb = 'db.oct.ovh'
const documents = [
  'author',
  'group',
  'publisher',
  'release',
  'serie',
]

const routes = documents.map(name => `gaman/${name}`)

const addDocument = (acc, key) => (acc[key] = {
  arg: 'id',
  methods: {
    get: [],
    put: [],
    delete: [],
  },
}, acc)

const api = apiBuilder(esdb, routes.reduce(addDocument, {
  '_count': 'post',
}))

const db = module.exports = api.gaman
db._source = res => res._source

const lockError = db.lockError = oops('redis-locked-error')

const redisApi = resolveId => {
  const apiCall = id => redis.call('get', resolveId(id))
    .then(JSON.parse)
    .then(val => {
      if (val !== null && val !== undefined) return val
      throw oops[404]()
    })


  apiCall.put = (id, value) =>
    redis.call('set', resolveId(id), JSON.stringify(value))

  apiCall.del = (id, value) => redis.call('del', resolveId(id))

  apiCall.setnx = (id, value) =>
    redis.call('setnx', resolveId(id), JSON.stringify(value))
      .then(ret => Number(ret) || Promise.reject(lockError()))

  return apiCall
}

const toJSON = r => r.json()
const firstHit = flow.path('hits.hits.0')

const toMatchStmt = match => ({ match })
const matchAll = map(toMatchStmt)
const prepQuery = (query, _id) => {
  if (isArr(query)) {
    query = { bool: { should: matchAll(query) } }
    if (isArr(_id)) {
      query.bool.must = { terms: { _id } }
    } else if (_id) {
      query.bool.must = { term: { _id } }
    }
  } else {
    query = toMatchStmt(query)
  }
  return { size: 1, query }
}

documents.forEach(name => {
  const key = `${name}Status`
  const url = `http://${esdb}/gaman/${name}/_search`
  db[key] = redisApi(id => `${name}-${id}`)
  const search = db[name].search = query => fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    body: JSON.stringify(query),
  }).then(toJSON)

  search.stupid = flow(prepQuery, search, firstHit)
})

db.group.getSeries = flow([
  groups => ({ size: 10000, query: { match: { groups } } }),
  db.release.search,
  flow.path('hits.hits'),
  map(flow.path('_source.title')),
  filter(Boolean),
  filter((val, i, a) => a.indexOf(val) === i),
])

db.progress = redisApi(id => `progress-${id}`)
