const state = require('izi/state')

// retrieve saved data
try {
  localStorage.state && state.retrieve(JSON.parse(localStorage.state))
} catch (err) {
  console.dir(err)
  console.error('failing to retrieve', localStorage.state)
  delete localStorage.state
}

// save state on unload
window.onbeforeunload = () => {
  localStorage.state = JSON.stringify(state.getCurrent())
}
