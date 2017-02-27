const oops = require('izi/oops')
const flow = require('izi/flow')
const map = require('izi/collection/map')
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

module.exports = api.gaman
module.exports._source = res => res._source

const lockError = module.exports.lockError = oops('redis-locked-error')

const toApi = resolveId => {
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
const prepQuery = query => {
  console.log('search', query)
  if (isArr(query)) {
    query = { bool: { should: matchAll(query) } }
  } else {
    query = toMatchStmt(query)
  }
  return { size: 1, query }
}

documents.forEach(name => {
  const key = `${name}Status`
  const url = `http://${esdb}/gaman/${name}/_search`
  module.exports[key] = toApi(id => `${name}-${id}`)
  const search = module.exports[name].search = query => fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    body: JSON.stringify(query),
  }).then(toJSON)

  search.stupid = flow(prepQuery, search, firstHit)
})

module.exports.progress = toApi(id => `progress-${id}`)
