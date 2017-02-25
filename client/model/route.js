const window = require('global/window')
const observ = require('izi/emiter/observ')
const route = require('izi/router')
const state = require('izi/state')
const qs = require('izi/query-string')

state.add('route', route)
state.retrieve(qs())

// clean url
window.location.hash = `/${route()}`

module.exports = route
