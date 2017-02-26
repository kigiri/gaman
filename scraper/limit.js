const oops = require('izi/oops')
const err = oops('limit_error')

module.exports = (limit=200, count = 0) => Object.assign(() => {
  if (count++ > limit) {
    throw err()
  }
}, {
  start: () => start,
  reset: () => count = 0,
})

module.exports.error = err