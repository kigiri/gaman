const limit = require('~/scraper/limit')
const oops = require('izi/oops')

module.exports = (fetch, start = 0, limitCount = 200) => {
  const limit404 = limit(start, limitCount)
  const next = n => fetch(n)
    .then(ret => ret && limit404.reset(n), oops[404].handle(() => limit404(n)))
    .then(() => next(n + 1))
    .catch(limit.error.handle(limit404.start))

  return next(start)
}