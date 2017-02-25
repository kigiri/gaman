const h = require('izi/h')
const color = require('ui/color')

const goToMain = h('a', {
  href: '/#/library',
  style: {
    textDecoration: 'none',
    color: color.orange.hsl
  }
})

console.log('lol', color.orange.hsl)

const routeName = h('span', {
  style: {
    background: color.selected.hsl,
    color: color.pink.hsl,
  }
})

const notFound = h('#not-found', {
  style: {
    margin: '150px auto',
    width: '70%',
    textAlign: 'center',
  }
})

module.exports = state => notFound([
  `=== ERROR 404 ===`,
  h.br(),
  h.br(),
  'route ',
  routeName(`/${state.route}`),
  ` not found `,
  h.br(),
  goToMain('<- back to library'),
])