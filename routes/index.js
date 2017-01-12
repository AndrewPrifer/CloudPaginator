const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const mv = require('mv');
const unzip = require('unzip');
const ejs = require('ejs');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const cheerio = require('cheerio');
const Inliner = require('inliner');
const EPub = require('epub');

router.post('/', function (req, res) {
  res.redirect('/paginate-html');
});

router.post('/paginate-html', function (req, res) {
  const json = req.body;
  const height = json.height;
  const width = json.width;
  const html = json.html;

  const inject = fs.readFileSync('assets/inject.ejs', 'utf8');
  const renderedInject = ejs.render(inject, { height: height, width: width });
  $ = cheerio.load(html);
  $('body').append(renderedInject);

  res.send($.html());
});

/**
 * This endpoint accepts an epub file, inlines the chapters and sends them back.
 */
router.post('/reader', upload.single('epub'), function (req, res) {
  // append .epub extension to generated filename
  const epubPath = `${req.file.path}.epub`;
  fs.renameSync(req.file.path, epubPath);

  const reader = new EPub(epubPath);

  reader.on('end', () => {
    fs.createReadStream(epubPath)
      .pipe(unzip.Extract({ path: req.file.path }))
      .on('close', () => {
        Promise.all(reader.flow.map(e => inline(path.join(req.file.path, e.href))))
          .then((htmls) => {
            console.log('done');
            res.send(htmls);
          });
      });
  });
  reader.parse();
});

/**
 * Promise version of the inliner.
 */
function inline(path) {
  return new Promise((resolve, reject) => {
    const inliner = new Inliner(path, (error, html) => {
      if (error) {
        reject(error);
      } else {
        resolve(html);
      }
    });
  });
}

module.exports = router;
