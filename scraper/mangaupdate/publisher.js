// https://www.mangaupdates.com/publishers.html?id=1039

const filter = require('izi/collection/filter')
const oops = require('izi/oops')
const {
  $$,
  raw,
  toText,
  cleanKey,
  linkIds,
  allLines,
  href,
  imgSrc,
} = require('~/scraper/parse-utils')

const mangakaInfo = raw.all({
  title: '.tabletitle',
  rawContent: '#main_content table table table table table tr', //seriously...
})

const catParsers = {
  alternateNames: el => toText(el).split('\n'),
  website: href,
  type: toText,
  notes: toText,
  lastUpdated: toText,
  publications: toText,
}

const filterCat = filter((_, i) => !(i % 3))
const filterContent = filter((_, i) => !((i + 2) % 3))

const parseResult = ({ title, rawContent }) => {
  const data = { name: toText(title[0]) }

  const cat = filterCat(rawContent)
  const content = filterContent(rawContent)

  cat.forEach((el, i) => {
    const key = cleanKey(el)
    const parser = catParsers[key]

    if (!parser) return
    data[key] = parser(content[i])
  })

  return data
}

module.exports = id =>
  mangakaInfo(`https://www.mangaupdates.com/publishers.html?id=${id}`)
    .then(ret => {
      if (ret.title.length) return ret
      throw oops[404](Error(`publishers ${id} not found`))
    })
    .then(parseResult)
