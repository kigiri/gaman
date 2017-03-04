
module.exports(88)
  .then(flow.path('0'))
  .then(getImages)
  .then(flow.path('0'))
  .then(request)
  .then(console.log)
// 
