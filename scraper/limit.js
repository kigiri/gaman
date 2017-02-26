const oops = require('izi/oops')
const err = oops('limit_error')

module.exports = (limit=200, count = 0, start) => Object.assign(() => {
  if (count++ > limit) {
    throw err()
  }
}, {
  start: () => start,
  reset: id => (count = 0, start = id),
})

module.exports.error = err