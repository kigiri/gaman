const h = require('izi/h')
const color = require('ui/color')

const book = h({
  style: {
    width: 100,
    height: 150,
    margin: 5,
    background: color.comment.alpha(0.5),
    border: `1px solid ${color.comment.alpha(0.3)}`,
    display: 'inline-block',
    boxShadow: `0 0 0 1px ${color.black.alpha(0.1)}`,
    lineHeight: '150px',
    fontSize: '24px',
    color: 'transparent',
  }
})


module.exports = (info, state) => book('.')
