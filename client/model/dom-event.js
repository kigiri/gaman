const each = require('izi/collection/each')
const event = require('izi/event')
const { add } = require('izi/state')

module.exports = each(key => add(key, event[key]))
