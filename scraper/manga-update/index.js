const flow = require('izi/flow')
const oops = require('izi/oops')
const each = require('izi/collection/each')
const db = require('~/db')
const fetcher = require('~/scraper/fetcher')
const scrap = {
  serie: require('./serie'),
  author: require('./author'),
}

const SECOND = 1000
const MINUTE = SECOND * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24

const types = {
  serie: 1,
  author: 2,
  publisher: 3,
  group: 4,
}

const timers = { fetching: MINUTE }

const setStatus = (type, id, status) => db[`${type}Status`].put(id, {
  status,
  ts: Date.now(),
})

const getProgress = type => db.progress(type).then(ret => ret._source.progress)
const setProgress = (type, progress) => db.progress.put(type, { progress })
  .then(() => progress)

const actions = {}

each((index, type) => {
  const notFoundMarkers = flow.stack()
  const syncDocument = id => db[`${type}Status`](id)
    .then(db._source)
    .then(sync => {
      const timer = timers[sync.status]
      if (timer && (Date.now() - sync.ts) > timer) {
        console.log(`${type} #${id} timedout, refetch`)
        throw oops[404]()
      }
      console.log(`${type} #${id} already ${sync.status}`)
    })
    .catch(oops[404].handle(() => setStatus(type, id, 'fetching')
      .then(() => db[type](id)
        .then(db._source)
        .catch(oops[404].handle(() => scrap[type](id)))
        .then(data => Promise.all([
            notFoundMarkers.execAndClear(),
            db[type].put(id, data),
            setStatus(type, id, 'stored'),
            getProgress(index)
              .then(lastId => lastId < id && setProgress(index, id)),
          ])
          .then(() => console.log(`${type} #${id} - added`)))
        .catch(oops[404].handle(err => {
          console.log(`${type} #${id} not found, skipping`)
          notFoundMarkers.push(() => setStatus(type, id, 'not found'))
          throw err
        })))))

  actions[type] = {
    get: id => db[type](id)
      .catch(oops[404].handle(() => scrap[type](id)
        .then(data => db[type].put(id, data)))),
    sync: tolerance => getProgress(index)
      .catch(oops[404].handle(() => setProgress(index, 0)))
      .then(id => fetcher(syncDocument, id, tolerance)),
  }
}, types)


actions.author.sync(25)
  .then(console.log)
  .catch(console.dir)
//db.serie(5)

/// yo
// this scrap and update the list of available manga from MU
/*
const rss = require('lib/rss')
const getTitle = el => el.children[1].textContent

const mangaUpdateRss = rss({
  selector: 'item',
  id: getTitle,
  refreshRate: 5,
  url: 'https://www.mangaupdates.com/rss.php',
})

mangaUpdateRss(res => res.map(getTitle).forEach(t => console.log(t)))
*/