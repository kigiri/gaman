const h = require('izi/h')
const dotStyle = {
  width: '80%',
  height: '80%',
  background: '#653716',
  border: '2px solid #48270f',
  borderRadius: '50%',
  margin: '10%',
  boxSizing: 'border-box',
}

const redDotStyle = {
  style: Object.assign({}, dotStyle, {
    background: '#c00',
    border: '2px solid #902'
  })
}

const face = h({
  style: {
    width: 50,
    height: 50,
  }
})

const dot = h({ style: dotStyle })

face[' '] = face
face['X'] = () => face(dot())
face['0'] = () => face(dot(redDotStyle))

const dice = h({
  style: {
    width: 150,
    height: 150,
    borderRadius: '5%',
    display: 'flex',
    flexWrap: 'wrap',
    background: '#fff9be',
    border: '2px solid #efe79a',
    boxSizing: 'content-box',
    margin: 5,
  }
})

const faces = Object.create(null)
const defs = [
  '    0    ',
  'X       X',
  'X   X   X',
  'X X   X X',
  'X X X X X',
  'X XX XX X',
].forEach((str, i) => faces[i + 1] = () =>
  dice(str.split('').map(x => face[x]({}))))

console.log(faces)

module.exports = n => faces[n]()
module.exports.fromZero = n => faces[n + 1]()