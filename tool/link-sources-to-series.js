const source = require('~/scraper/source')
const flow = require('izi/flow')
const map = require('izi/collection/map')

flow([
  map.toArr(flow.path('link')),
  flow.serie.workers(3),
])(source)
  .then(console.log, console.dir)

/*
### don't forget to reference the mapping first or die in hell
curl -XPUT 'db.oct.ovh/gaman/_mapping/serie?pretty' -H 'Content-Type: application/json' -d'
{
  "properties" : {
    "mangapandaRef" : { "type" : "string", "index" : "not_analyzed" },
    "mangahereRef" : { "type" : "string", "index" : "not_analyzed" },
    "mangastreamRef" : { "type" : "string", "index" : "not_analyzed" },
    "mangafoxRef" : { "type" : "string", "index" : "not_analyzed" },
    "mangareaderRef" : { "type" : "string", "index" : "not_analyzed" },
    "egscansRef" : { "type" : "string", "index" : "not_analyzed" }
    "mangacowRef" : { "type" : "string", "index" : "not_analyzed" }
    "lineWebtoonRef" : { "type" : "string", "index" : "not_analyzed" }
  }
}
'

curl -XPUT 'db.oct.ovh/gaman/_mapping/serie?pretty' -H 'Content-Type: application/json' -d'
{ "properties" : { "lineWebtoonRef" : { "type" : "string", "index" : "not_analyzed" } } }'


find a team id:

const db = require('~/db')
db.group.search.stupid({ name: 'line webtoon' })
  .then(r => console.log(r._id))

*/

/**/