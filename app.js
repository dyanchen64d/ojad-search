const express = require('express')
const app = express()
const superagent = require('superagent')
const cheerio = require('cheerio')
const bodyParser = require('body-parser')
const md5 = require('js-md5')
const config = require('./config.js')

app.use(bodyParser.json());

function getWordsJSON (qs) {
  return superagent
    .get(config.ojadUrl + encodeURI(qs))
    .then((res) => {
      let _text = res.text
      let $ = cheerio.load(_text)
      let wordsObj = {}, tempKey = $('#word_table>thead .midashi').text()

      $('#word_table>tbody>tr').each((idx, tr) => {
        let $tr = $(tr)

        // 有 id 属性的是单词，否则是词性分类
        if($tr.attr('id')) {
          let _word = {}

          $tr.children('td').each((tdidx, td) => {
            let tdclassArr = $(td).attr('class').split(' ')
            let tdclass = tdclassArr[tdclassArr.length - 1]
            // console.log(tdclass);
            if (tdclass === 'midashi') {
              _word[tdclass] = $(td).find('.midashi_word').text()
            } else if (tdclass === 'visible') {
              //
            } else {
              _word[tdclass] = $(td).find('.accented_word').text()
            }
          })

          if (wordsObj[tempKey]) {
            wordsObj[tempKey].push(_word)
          } else {
            wordsObj[tempKey] = []
            wordsObj[tempKey].push(_word)
          }
        } else {
          tempKey = $tr.children('.midashi').text()
        }
      })
      // console.log(wordsObj);
      return wordsObj
    })
}

function getYouDaoTranslation (qs) {
  let url = config.youdaoUrl,
      q = qs,
      from = 'ja',
      to = 'zh-CHS',
      appKey = config.youdaoId,
      salt = Math.floor(Math.random() * Math.floor(10)),
      sign = md5(appKey+q+salt+config.youdaoSecret)

  return superagent
    .get(`${config.youdaoUrl}?q=${encodeURI(q)}&from=${from}&to=${to}&appKey=${appKey}&salt=${salt}&sign=${sign}`)
    .then((res) => {
      return res.body
    })
}

app.post('/search-katsuyo', async function (req, res, next) {
  let qs = req.body.word,
      words = await getWordsJSON(qs),
      youdao = await getYouDaoTranslation(qs)
  res.send({ youdao: youdao, ...words })
})

app.listen(3001, () => console.log('app listened on 3001....'))
