// define some usefull globals
const window = require('global/window')
window.global = window
window.noOp = () => {}
window.wesh = (...args) => (console.log(...args), args[args.length - 1])

// init model
require('model/persistence')
require('model/route')
require('model/dom-event')([
  'focus',
  'hover',
//  'lbtn',
//  'mbtn',
//  'rbtn',
//  'mouseX',
//  'mouseY',
//  'domWidth',
//  'domHeight',
  'viewWidth',
//  'viewHeight',
//  'scrollTop',
//  'scrollBottom',
])

/*
// inject CSS
const inject = require('izi/inject')
inject.css('./node_modules/bulma/css/bulma.css')
*/
// Bind view to model
const { onChange } = require('izi/state')
const { render, h } = require('izi/h')
const route = require('ui/route')
const style = require('ui/css')
const id = '_root'
const app = h('#app', { style })

if (document.getElementById(id)) {
  document.getElementById(id).remove()
}

const _root = document.createElement('div')
_root.id = id

onChange(state => render(app((route[state.route] || route[404])(state)), _root))
document.body.appendChild(_root)
