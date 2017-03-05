const flow = require('izi/flow')
const map = require('izi/collection/map')
const filter = require('izi/collection/filter')
const fetch = require('node-fetch')
const { split } = require('izi/str')
const { $, toText, mapGet, mapArr } = require('~/scraper/parse-utils')

const domain = 'http://www.mangahere.co'
const getDetails = flow(name => fetch(`${domain}/ajax/series.php`, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
    body: `name=${encodeURIComponent(name)}`,
  }),
  r => r.json(),
  mapArr({ 0: 'title', 5: 'author', 6: { key: 'year', fn: Number } }, String))

// fallback if tooltip info isn't available
const cleanup = flow.pipe(toText, txt => txt.slice(txt.indexOf(':') + 1).trim())

const joinNames = (name, altNames) => (altNames
  ? altNames.split('; ').concat([ name ])
  : [ name ])

const getDetailsFallback = flow(mapGet('.detail_topText li', {
 2: { key: 'altNames', fn: cleanup },
 4: { key: 'author', fn: cleanup },
 5: { key: 'artist', fn: cleanup },
 8: { key: 'name', fn: flow.pipe($.h2, toText) },
}), ({ name, altNames, author, artist }) => (altNames
  ? altNames.split('; ').concat([ name ])
  : [ name ]).map(title => filter({ title, author, artist })))

const blackList = [
  'a_method_to_make_the_world_gentle',
  'blue_cat_happy',
  'dragon_ball_super',
  'fairy_tail_blue_mistral_wendel_s_adventure',
  'fairy_tail_sabertooth',
  'i_female_robot',
  'one_shot_meteor_syndrome',
  'rurouni_kenshin_to_rule_flame',
  'the_scholar_who_walks_the_night',
  'the_seven_deadly_sins_side_story_the_young_girl_s_unbearable_dream',
  'tokyo_alien_bros',
]

module.exports = {
  listUrl: `${domain}/mangalist`,
  path: 'a.manga_info',
  buildQueries: flow.pipe([
    filter(a => blackList.indexOf(a.attribs.href.slice(30, -1)) !== -1),
    //filter(a => blackList.indexOf(a.attribs.href.slice(30, -1)) === -1),
    map(a => ({
      source: a.attribs.href.slice(30, -1),
      getQuery: [
        () => getDetails(a.attribs.rel).then(res => res && res.year && res),
        () => getDetailsFallback(a.attribs.href),
      ],
    })),
  ]),
}
