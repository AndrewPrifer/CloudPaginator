const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const mv = require('mv');
const unzip = require('unzip');
const ejs = require('ejs');
const multer = require('multer');
const upload = multer({dest: 'uploads/'});

const cheerio = require('cheerio');

router.post('/', function(req, res) {
  res.redirect('/paginate-html');
});

router.post('/paginate-html', function(req, res) {
  const json = req.body;
  const height = json.height;
  const width = json.width;
  const html = json.html;

  const inject = fs.readFileSync('assets/inject.ejs', 'utf8');
  const renderedInject = ejs.render(inject, {height: height, width: width});
  $ = cheerio.load(html);
  $('body').append(renderedInject);

  res.send($.html());
});

router.post('/paginate-epub', upload.single('epub'), function(req, res) {
  const epubPath = `${req.file.path}.epub`;
  fs.renameSync(req.file.path, epubPath);
  fs.createReadStream(epubPath).pipe(unzip.Extract({ path: path.join('public/epub', req.file.filename) }));

  // TODO create reader

  res.send({ path: `/${req.file.filename}` });
});

module.exports = router;
