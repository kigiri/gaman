global.fetch = require('node-fetch') // poly fetch
const apiBuilder = require('izi/api-builder')
const routes = [
  'gaman/progress',
]

const documents = [
  'author',
  'group',
  'publisher',
  'release',
  'serie',
]

documents.forEach(name => routes.push(`gaman/${name}`, `gaman/${name}Status`))

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
}
))

module.exports = api.gaman
module.exports._source = res => res._source
