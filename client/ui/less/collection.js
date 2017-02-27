const h = require('izi/h')
const book = require('./book')
const scrollBar = require('izi/scroll-bar')
const color = require('ui/color')

const collection = h({
  style: {
    marginTop: 25,
  }
})

const pageBtn = h({
  style: {
    width: 40,
    height: 150,
    margin: 5,
    lineHeight: '150px',
    display: 'inline-block',
    fontSize: '24px',

    background: color.comment.alpha(0.1),
    border: `1px solid ${color.comment.alpha(0.1)}`,
    boxShadow: `0 0 0 1px ${color.black.alpha(0.1)}`,
  }
})

const collectionTitle = h('h1', {
  style: {
    padding: '0 12px',
    display: 'inline-block',
  }
})

const placeholderBooks = Array(15).fill()

module.exports = (c, state) => {
  const {
    title,
    id,
    position,
    selection,
    select,
    next,
    prev,
    booksPerView
  } = c
  const books = c.books || placeholderBooks
  const selected = (id === state.selectedCollection)

  return collection([
    collectionTitle(title),
    h.div({
      style: {
        width: state.viewWidth - (scrollBar + 2),
        overflowX: 'auto',
        position: 'relative',
        textAlign: 'center',
      },
    }, h.div({
      style: {
        //margin: '0 auto',
      }
    }, [
      pageBtn({ onclick: prev }, position ? '<' : '~'),
      books.slice(position, booksPerView).map(b => book(b, state)),
      pageBtn({ onclick: next }, '>'),
    ])),
  ])
}
