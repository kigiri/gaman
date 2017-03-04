
const fs = require('fs')
const request = require('request')
const { extname, dirname, resolve, isAbsolute } = require('path')
const f = require('izi/flow')
const { exec } = require('izi/mz')('child_process')
const { unlink, mkdir, readdir, rename } = require('izi/mz')('fs')
const map = require('izi/collection/map')

const root = resolve('../db/assets')
const save = (opts, dest) => new Promise((s, f) => {
  isAbsolute(dest) || (dest = resolve(root, dest))
  ws = fs.createWriteStream(dest)
  ws.on('error', f)
  ws.on('close', () => s(dest))
  request(opts).pipe(ws)
})

const readdirFull = dir => readdir(dir)
  .then(map(file => resolve(dir, file)))

const extract = Object.assign(file => {
  file = resolve(file)
  const ext = extname(file).slice(1)
  const dir = file.slice(0, -(ext.length + 1))

  return extract[ext]({ file, ext, dir })
}, {
  rar: f([
    f.hold.get('dir', mkdir),
    f.hold(({ dir, file }) => exec(`unrar e ${file}`, { cwd: dir })),
    f.hold.get('file', unlink),
    f.path('dir'),
    readdirFull,
  ])
})

const pad3 = n => ('000' + n).slice(-4)
const getFileName = (file, name) => `${name}${extname(file)}`
const formatNameFromIdx = (name, idx) => getFileName(name, pad3(idx))

const renameInplace = (file, name) =>
  rename(file, resolve(dirname(file), name))

module.exports = {
  save,
  extract,
  formatNameFromIdx,
  rename: renameInplace,
  fetchAndExtract: f([
    ({ uri, chapter }) => save(uri, `${formatNameFromIdx(uri, chapter)}`),
    extract,
    map((file, idx) => renameInplace(file, formatNameFromIdx(file, idx))),
    f.all,
    f.path('length'),
  ]),
}