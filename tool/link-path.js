const wavy = require('izi/wavy')
const path = require('path')
const resolve = base => part => path.resolve(__dirname, base, part)
const root = resolve('../')
const modules = resolve('../node_modules')

wavy({
  [root('client/model')]: modules('model'),
  [root('client/ui')]: modules('ui'),
})