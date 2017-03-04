const oops = require('izi/oops')
const {
  $$,
  raw,
  toText,
  linkIds,
} = require('~/scraper/parse-utils')

const pageInfo = raw.all({
  all: '#main_content > table table table tr',
//  series: '#main_content tr:nth-child(3) .table_content tr a',
})

const parseResult = all => all.map(el => {
  const [ date, title, vol, chp, grp ] = $$.td(el)
  const groups = linkIds(grp)
  const time = (new Date(toText(date))).getTime()

  return {
    date: time || 0,
    title: linkIds(title)[0],
    volume: toText(vol),
    chapter: toText(chp),
    groups,
    groupText: toText(grp),
  }
})

module.exports = page =>
  pageInfo(`https://www.mangaupdates.com/releases.html?act=archive&page=${page}&perpage=100&asc=asc`)
    .then(ret => {
      if (ret.all.length > 5) return parseResult(ret.all.slice(2, -4))
      throw oops[404](Error(`page ${page} is empty`))
    })
