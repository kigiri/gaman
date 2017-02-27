const linker = require('~/scraper/linker')
const flow = require('izi/flow')

/*
### don't forget to reference the mapping first or die in hell
curl -XPUT 'db.oct.ovh/gaman/_mapping/serie?pretty' -H 'Content-Type: application/json' -d'
{
  "properties" : {
    "mangapandaRef" : { "type" : "string", "index" : "not_analyzed" },
    "mangahereRef" : { "type" : "string", "index" : "not_analyzed" }
  }
}
'
*/

Promise.all([
  'mangapanda',
//  'mangahere',
].map(source => linker(source, require(`~/scraper/${source}/link`))))
  .then(console.log, console.dir)
