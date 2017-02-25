const state = require('izi/state')
const dom = require('model/dom-event')
const collectionView = require('ui/less/collection')
const observ = require('izi/emiter/observ')

const positions = {}
const bookWidth = 100
const booksPerView = observ.map(viewWidth =>
  Math.floor((viewWidth - bookWidth) / (bookWidth + 20)), dom.viewWidth)

const move = (collection, step) => {
  const { selected } = collection
  const id = collection.id
  collection.position.set()



}



module.exports = collection => {
  collectionView()
}

//{ title, id, position, selection, select, next, prev }