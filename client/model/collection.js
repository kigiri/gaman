const observ = require('izi/emiter/observ')
const state = require('izi/state')
const collections = state.add('collections', [])
let id = 0

const addCollection = () => collections.push(state.add(`collection-${++id}`, {
  id,
  title: `dummy collection ${id}`,
  books: Array(15).fill().map((_, i) => `${id}-${i}`),
  selected: 0,
}))

module.exports = collections
