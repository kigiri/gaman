const flow = require('izi/flow')
const oops = require('izi/oops')
const each = require('izi/collection/each')
const map = require('izi/collection/map')
const db = require('~/db')

const fetcher = require('~/scraper/fetcher')
const scrap = {
  author: require('./author'),
  group: require('./group'),
  publisher: require('./publisher'),
  release: require('./release'),
  serie: require('./serie'),
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

let lastMsg
//const verbose = str => { lastMsg = str }
const verbose = str => { console.log(str) }

let timeout
const requestLog = () => {
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    requestLog()
    if (!lastMsg) return
    console.log(lastMsg)
    lastMsg = undefined
  }, 5000)
}

const log = str => requestLog(console.log(str))

const initStatus = (type, id, status) => db[`${type}Status`].setnx(id, {
  status: 'fetching',
  ts: Date.now(),
})

const getProgress = type => db.progress(type)
const setProgress = (type, progress) => db.progress.put(type, progress)
  .then(() => progress)

const actions = {}

const syncStatus = (type, id, sync) => {
  const timer = timers[sync.status]
  if (timer && (Date.now() - sync.ts) > timer) {
    verbose(`${type} #${id} timedout, refetch`)
    return db[`${type}Status`].del(id)
      .then(() => Promise.reject(oops[404]()))
  }
  verbose(`${type} #${id} already ${sync.status}`)
  return sync.status === 'stored'
}

each((index, type) => {
  const notFoundMarkers = flow.stack()
  const syncDocument = id => db[`${type}Status`](id)
    .then(sync => syncStatus(type, id, sync))
    .catch(oops[404].handle(() => initStatus(type, id)
      .then(() => db[type](id)
        .then(db._source)
        .catch(oops[404].handle(() => scrap[type](id)))
        .then(data => db[type].put(id, data))
        .then(() => Promise.all([
          notFoundMarkers.execAndClear(),
          setStatus(type, id, 'stored'),
          getProgress(index)
            .then(lastId => lastId < id && setProgress(index, id)),
        ]))
        .then(() => (log(`${type} #${id} - added`), true))
        .catch(oops[404].handle(err => {
          verbose(`${type} #${id} not found, skipping`)
          notFoundMarkers.push(() => setStatus(type, id, 'not found'))
          throw err
        })))
      .catch(db.lockError.handle(() =>
        verbose(`${type} #${id} caugth in locking... skipping !`)))))

  actions[type] = {
    get: id => db[type](id)
      .catch(oops[404].handle(() => scrap[type](id)
        .then(data => db[type].put(id, data)
          .then(() => data)))),
    sync: tolerance => (log(`begin sync of ${type}`), getProgress(index))
      .catch(oops[404].handle(() => setProgress(index, 0)))
      .then(id => fetcher(syncDocument, id, tolerance)),
  }
}, types)

const syncRelease = page => db.releaseStatus(page)
  .then(sync => syncStatus('release', page, sync))
  .catch(oops[404].handle(() => initStatus('release', page)
    .then(() => scrap.release(page)
      .then(data => flow.serie(data.map((release, i) => () =>
        db.release.put(((page - 1) * 100) + i + 1, release).then(() =>
          log(`release #${((page - 1) * 100) + i + 1} done`))), 25)
        .then(() => data.length > 99 && Promise.all([
          setStatus('release', page, 'stored'),
          getProgress(5)
            .then(lastId => lastId < page && setProgress(5, page)),
        ])))
      .then(() => (log(`release page ${page} - added`), true))
      .catch(db.lockError.handle(() =>
        verbose(`release page ${page} caugth in locking... skipping !`))))))

actions.release = {
  get: id => db.release(id)
    .catch(oops[404].handle(() => scrap.release(Math.floor(id / 100))
      .then(data => db.release.put(id, data[id % 100])
        .then(() => data)))),
  sync: () => (log(`begin sync of release`), getProgress(5))
    .catch(oops[404].handle(() => setProgress(5, 1)))
    .then(page => fetcher(syncRelease, page, 0))
}

const syncAll = flow.stack()
// asyncAll.push(() => Promise.all(Array(5).fill().map((_, i) => setProgress(i + 1, Number(i === 4)))))
//setProgress(5, 3570)



syncAll.push(() => actions.release.sync(5))
syncAll.push(() => actions.author.sync(5))
syncAll.push(() => actions.group.sync(5))
syncAll.push(() => actions.publisher.sync(5))
syncAll.push(() => actions.serie.sync(250))
syncAll.push(flow.delay(60000))

//setProgress(5, 1).then(() =>
  //actions.release.sync(5)
//actions.serie.sync(5)
syncAll.exec(1)
  .then(console.log)
  .catch(console.dir)
//)

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

