global.fetch = require('node-fetch') // poly fetch
const apiBuilder = require('izi/api-builder')
const addDocument = (acc, key) => (acc[key] = {
  arg: 'id',
  methods: {
    get: [],
    put: [],
    delete: [],
  },
}, acc)

const api = apiBuilder('db.oct.ovh', [
  'gaman/progress',
  'gaman/serie',
  'gaman/seriesStatus',
  'gaman/author',
  'gaman/authorStatus',
].reduce(addDocument, {
  '_count': 'post',
}
))

module.exports = api.gaman
module.exports._source = res => res._source
