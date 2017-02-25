const { add } = require('izi/state')
const  obsArr = require('izi/observ-array')

module.exports = require('izi/state').add('rand', obsArr([0, 0, 0, 0, 0, 0]))
