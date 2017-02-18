const oops = require('izi/oops')
const err = oops('limit_error')

module.exports = (start, limit=200) => Object.assign(id => {
  if ((id - start) > limit) {
    throw err()
  }
}, {
  start: () => start,
  reset: id => start = id,
})

module.exports.error = err