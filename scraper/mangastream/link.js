const f = require('izi/flow')
const { split } = require('izi/str')
const map = require('izi/collection/map')
const merge = require('izi/collection/merge')
const { Array: { reverse } } = require('izi/proto')
const { raw, toText } = require('~/scraper/parse-utils')

const domain = 'http://www.mangastream.com'


const parseTitle = f.pipe([
  toText,
  split.cook(/([0-9]+) - (.+)/),
  ([ , chapter, title ]) => ({ title, chapter: Number(chapter) }),
])

module.exports = {
  listUrl: `${domain}/manga`,
  path: 'table tr strong > a',
  teamId: 3205,
  buildQueries: map(a => ({
    source: a.attribs.href.slice(29),
    getQuery: () => Promise.resolve({ title: toText(a) }),
  })),
  chapters: f([
    ref => `http://mangastream.com/manga/${ref}`,
    raw.all('.content table a'),
    reverse,
    map((a, index) => merge(parseTitle(a), { uri: a.attribs.href, index })),
  ]),
  pages: f([
    f.path('uri'),
    raw.all('.controls .btn-reader-page li a'),
    map(f.path('attribs.href')),
  ]),
  image: f([
    raw('#manga-page'),
    f.path('attribs.src'),
  ]),
}

