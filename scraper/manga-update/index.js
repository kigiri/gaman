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

const getProgress = type => db.progress(type)
const setProgress = (type, progress) => db.progress.put(type, progress)
  .then(() => progress)

const actions = {}

const syncStatus = (type, id, sync) => {
  const timer = timers[sync.status]
  if (timer && (Date.now() - sync.ts) > timer) {
    console.log(`${type} #${id} timedout, refetch`)
    throw oops[404]()
  }
  console.log(`${type} #${id} already ${sync.status}`)
}

each((index, type) => {
  const notFoundMarkers = flow.stack()
  const syncDocument = id => db[`${type}Status`](id)
    .then(sync => syncStatus(type, id, sync))
    .catch(oops[404].handle(() => setStatus(type, id, 'fetching')
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
        .then(() => console.log(`${type} #${id} - added`))
        .catch(oops[404].handle(err => {
          console.log(`${type} #${id} not found, skipping`)
          notFoundMarkers.push(() => setStatus(type, id, 'not found'))
          throw err
        })))))

  actions[type] = {
    get: id => db[type](id)
      .catch(oops[404].handle(() => scrap[type](id)
        .then(data => db[type].put(id, data)
          .then(() => data)))),
    sync: tolerance => getProgress(index)
      .catch(oops[404].handle(() => setProgress(index, 0)))
      .then(id => fetcher(syncDocument, id, tolerance)),
  }
}, types)

const syncRelease = page => db.releaseStatus(page)
  .then(sync => syncStatus('release', page, sync))
  .catch(oops[404].handle(() => setStatus('release', page, 'fetching')
    .then(() => scrap.release(page)
      .then(data => flow.serie(data.map((release, i) => () =>
        db.release.put(((page - 1) * 100) + i + 1, release).then(() =>
          console.log(`release #${((page - 1) * 100) + i + 1} done`))), 25))
      .then(() => Promise.all([
        setStatus('release', page, 'stored'),
        getProgress(5)
          .then(lastId => lastId < page && setProgress(5, page)),
      ]))
      .then(() => console.log(`release page ${page} - added`)))))
  .catch(oops[404].handle(() => page))

actions.release = {
  get: id => db.release(id)
    .catch(oops[404].handle(() => scrap[type](Math.floor(id / 100))
      .then(data => db[type].put(id, data[id % 100])
        .then(() => data)))),
  sync: () => getProgress(5)
    .catch(oops[404].handle(() => setProgress(5, 1)))
    .then(page => fetcher(syncRelease, page, 0))
}

const syncAll = flow.stack()
syncAll.push(() => Promise.all(Array(5).fill().map((_, i) => setProgress(i + 1, Number(i === 4)))))
syncAll.push(() => actions.release.sync(5))
syncAll.push(() => actions.author.sync(5))
syncAll.push(() => actions.group.sync(5))
syncAll.push(() => actions.publisher.sync(5))
syncAll.push(() => actions.serie.sync(5))
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

