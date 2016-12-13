var express = require('express');
var router = express.Router();
var fs = require('fs');
var ejs = require('ejs');

var cheerio = require('cheerio');

router.post('/', function(req, res) {
  res.redirect('/paginate-html');
});

router.post('/paginate-html', function(req, res) {
  var json = req.body;
  var height = json.height;
  var width = json.width;
  var html = json.html;

  var inject = fs.readFileSync(__dirname + '/../assets/inject.ejs', 'utf8');
  var renderedInject = ejs.render(inject, { height: height, width: width });
  $ = cheerio.load(html);
  $('body').append(renderedInject);

  res.send($.html());
});

module.exports = router;
