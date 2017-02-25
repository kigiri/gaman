const oops = require('izi/oops')
const YoRedis = require('yoredis')
const redis = new YoRedis({ url: 'redis://91.121.220.177:6379' })

global.fetch = require('node-fetch') // poly fetch
const apiBuilder = require('izi/api-builder')
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

const api = apiBuilder('db.oct.ovh', routes.reduce(addDocument, {
  '_count': 'post',
}))

module.exports = api.gaman
module.exports._source = res => res._source

module.exports.lockError = oops('redis-locked-error')

const toApi = resolveId => {
  const apiCall = id => redis.call('get', resolveId(id))
    .then(JSON.parse)
    .then(val => {
      if (val !== null && val !== undefined) return val
      throw oops[404]()
    })

  apiCall.put = (id, value) =>
    redis.call('set', resolveId(id), JSON.stringify(value))

  apiCall.setnx = (id, value) =>
    redis.call('setnx', resolveId(id), JSON.stringify(value))
      .then(ret => Number(ret) || Promise.reject(lockError()))

  return apiCall
}

documents.forEach(name => {
  const key = `${name}Status`
  module.exports[key] = toApi(id => `${name}-${id}`)
})

module.exports.progress = toApi(id => `progress-${id}`)
