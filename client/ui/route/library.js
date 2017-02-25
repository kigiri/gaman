const h = require('izi/h')
const collection = require('ui/less/collection')

const collections = [
  { title: 'Subscriptions' },
  { title: 'Fresh series' },
  { title: 'Keep reading' },
  // { title: 'Because you liked ...' }
  { title: 'Populars' },
]

const library = h('#library')

module.exports = state => library(collections
  .map(data => collection(data, state)))