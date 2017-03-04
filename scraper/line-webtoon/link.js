const db = require('~/db')
const f = require('izi/flow')
const map = require('izi/collection/map')
const { raw } = require('~/scraper/parse-utils')
const { range } = require('izi/arr')
const { extract, cut } = require('izi/str')

const domain = 'http://www.webtoons.com/'
const headers = { Referer: domain }

const getChapters = f([
  id => `${domain}en/x/x/list?title_no=${id}`,
  raw('#_listUl > li:first-child'),
  f.path('attribs.data-episode-no'),
  Number,
  range.from(1),
  map(index => ({ index, uri: `${domain}en/x/x/x/viewer?episode_no=${index}` })),
])

module.exports = {
  teamId: 6076,

  findRef: f([
    cut.after('('),
    encodeURIComponent,
    keyword => `${domain}/search?keyword=${keyword}`,
    raw('.card_lst li:first-child > a'),
    f.path('attribs.href'),
    extract(/titleNo=([0-9]+)/),
  ]),

  chapter: id => getChapters(id)
    .then(map(link => `${link}&title_no=${id}`)),

  images: f([
    raw.all('.viewer_img img'),
    map(f.pipe(f.path('attribs.data-url'), uri => ({ uri, headers }))),
  ]),
}
