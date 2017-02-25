const oops = require('izi/oops')
const YoRedis = require('yoredis')
const redis = new YoRedis({ url: 'redis://91.121.220.177:6379' })
const redisSet = (key, value) => redis.call('set', key, value)
const redisGet = key => redis.call('get', key)

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

const toApi = resolveId => {
  const apiCall = id => redisGet(resolveId(id))
    .then(JSON.parse)
    .then(val => {
      if (val === null || val === undefined) {
        throw oops[404]()
      }
      console.log({val})
      return val
    })
  apiCall.put = (id, value) => redisSet(resolveId(id), JSON.stringify(value))
  return apiCall
}

documents.forEach(name => {
  const key = `${name}Status`
  module.exports[key] = toApi(id => `${name}-${id}`)
})

module.exports.progress = toApi(id => `progress-${id}`)
