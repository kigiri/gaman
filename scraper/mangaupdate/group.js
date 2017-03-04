// https://www.mangaupdates.com/groups.html?id=15

const oops = require('izi/oops')
const {
  $,
  $$,
  raw,
  toText,
  cleanKey,
  linkIds,
  bool,
  num,
  allLines,
  href,
  imgSrc,
} = require('~/scraper/parse-utils')

const mangakaInfo = raw.all({
  groupInfo: '#main_content tr:nth-child(1) .table_content tr',
//  series: '#main_content tr:nth-child(3) .table_content tr a',
})


const aliases = { groupName: 'name' }
const catParsers = {
  groupName: toText,
  irc: toText,
  twitter: href,
  facebook: href,
//  releaseFrequency: toText,
//  numberOfReleases: num,
//  active: bool,
//  totalSeries: num,
//  genres: ,
//  categories: ,
}

const parseResult = ({ groupInfo, series }) => {
  const data = {
  //  series: linkIds(series)
  }

  const cat = groupInfo.forEach(el => {
    const [ keyElem, valElem ] = $$.td(el)
    const key = cleanKey($.u(keyElem))
    const parser = catParsers[key]

    if (!parser) return
    data[aliases[key] || key] = parser(valElem)
  })
  return data
}

module.exports = id =>
  mangakaInfo(`https://www.mangaupdates.com/groups.html?id=${id}`)
    .then(ret => {
      if (ret.groupInfo.length) return ret
      throw oops[404](Error(`group ${id} not found`))
    })
    .then(parseResult)
