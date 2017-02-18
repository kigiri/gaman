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
  image: imgSrc,
  associatedNames: allLines,
  name: toText,
  birthPlace: toText,
  birthDate: toText,
  zodiac: toText,
  lastUpdated: toText,
  comments: toText,
  bloodType: toText,
  gender: toText,
  genres: el => toText($$.u(el)),
  officialWebsite: href,
  twitter: href,
  facebook: href,
  //latestRelease: toText,
  //activityStats: toText,
}

const filterCat = filter((_, i) => !(i % 3))
const filterContent = filter((_, i) => !((i + 2) % 3))

const parseResult = ({ title, rawContent }) => {
  const data = {}

  const cat = filterCat(rawContent)
  const content = filterContent(rawContent)

  cat.forEach((el, i) => {
    const key = cleanKey(el)
    const parser = catParsers[key]

    if (!parser) return
    data[key] = parser(content[i])
  })

  data.originalName = data.name
  data.name = toText(title[0])

  return data
}

module.exports = id =>
  mangakaInfo(`https://www.mangaupdates.com/authors.html?id=${id}`)
    .then(ret => {
      if (ret.title.length) return ret
      throw oops[404](Error(`author ${id} not found`))
    })
    .then(parseResult)
