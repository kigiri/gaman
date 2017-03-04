const f = require('izi/flow')
const map = require('izi/collection/map')
const reduce = require('izi/collection/reduce')
const filter = require('izi/collection/filter')
const { raw, toText, get, num, mapArr } = require('~/scraper/parse-utils')
const { split } = require('izi/str')
const db = require('~/db')
const normalize = str => str.replace(/[ _-]+/g, '')
const levenshtein = require('izi/levenshtein-distance')
const memo = require('izi/stupid-memo')

const domain = 'http://egscans.com'
const domainDl = 'http://download.egscans.com/'

const mapr = mapArr({
  5: 'originalName',
  9: { key: 'authors', fn: el => toText(el).split('/') },
})

const store = f(get('#recent-posts .su-tabs-panes .su-spoiler-style-fancy'),
  map(el => {
    const [ rawTitle, content ] = el.children
    const { originalName, authors: [ author, artist ] } = mapr(content.children)
    const title = toText(rawTitle)
    const key = normalize(title).toLowerCase()

    return { author, artist, originalName, title, key }
  }))(`${domain}/projects_directory`)

const dist = a => b => levenshtein(a, b)
const find = f(toText, rawPattern => {
  const score = f.pipe(f.path('key'),
    memo(dist(normalize(rawPattern).toLowerCase())))

  return store.then(s => s.sort((a, b) => score(a) - score(b))[0])
}, ({originalName, author, artist, title}) => [
  { author, artist, title },
  { author, artist, title: originalName },
])


const parseChapter = f.pipe(split.cook(/ch([0-9]+)/), f.path('1'), Number)

module.exports = {
  listUrl: domainDl,
  path: 'td.table-filename > a',
  teamId: 3477,
  buildQueries: map(a => ({
    source: a.attribs.href.slice(9),
    getQuery: () => find(a),
  })),
  chapters: f([
    ref => `${domainDl}/display/${ref}`,
    raw.all('.table-filename > a'),
    map((a, index) => {
      const text = toText(a)

      return {
        index,
        chapter: parseChapter(text),
        uri: `${domainDl}${a.attribs.href}`,
      }
    }),
  ]),
}

module.exports.getChapters('Attaque')
  .then(console.log)
  
