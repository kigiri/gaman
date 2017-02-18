const oops = require('izi/oops')
const {
  $,
  $$,
  raw,
  bool,
  toText,
  imgSrc,
  linkIds,
  cleanCat,
  allLines,
} = require('~/scraper/parse-utils')

const serieInfo = raw.all({
  cat: '.sCat',
  title: 'span.releasestitle.tabletitle',
  content: '.sContent',
})

const getAvg = str => {
  if (!str) return ''
  const idx = str.indexOf(' / ')
  if (idx === -1) return ''
  return str.slice(0, idx)
}

const catParsers = {
  description: toText,
  type: toText,
  relatedSeries: linkIds,
  associatedNames: allLines,
  groupsScanlating: linkIds,
  statusInCountryOfOrigin: allLines,
  completelyScanlated: bool,
  animeStart: el => allLines(el).join('\n'),
  userReviews: linkIds,
  userRating: el => parseFloat(getAvg(allLines(el)[0].slice(9))),
  lastUpdated: toText,
  image: imgSrc,
  genre: el => toText($$.u(el)).slice(0, -1),
  categories: el => $$.a(el)
    .filter(el => el.attribs.title)
    .map(el => ({
      score: Number(el.attribs.title.split(/Score: ([0-9]+)/)[1]),
      name: toText(el),
    })),
  categoryRecommendations: linkIds,
  recommendations: linkIds,
  author: linkIds,
  artist: linkIds,
  year: el => Number(toText(el)),
  originalPublisher: linkIds,
  serializedIn: el => toText($$.u(el)),
  licensed: bool,
  englishPublisher: linkIds,
  listStats: el => {
    const [ reading, wish, completed, unfinished, custom ] = toText($$.u(el))
      .map(Number)

    return { reading, wish, completed, unfinished, custom }
  },
  //latestRelease: toText,
  //activityStats: toText,
}

const parseResult = ({ title, cat, content }) => {
  const data = { title: toText(title[0]) }

  cat.forEach((el, i) => {
    const key = camelCase(cleanCat(toText(el)))
    const parser = catParsers[key]

    if (!parser) return
    data[key] = parser(content[i])
  })

  return data
}

module.exports = id =>
  serieInfo(`https://www.mangaupdates.com/series.html?id=${id}`)
    .then(raw => {
      if (raw.title.length) return raw
      throw oops[404](Error(`serie ${id} not found`))
    })
    .then(parseResult)
