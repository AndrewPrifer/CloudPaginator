const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const mv = require('mv');
const unzip = require('unzip');
const ejs = require('ejs');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const cheerio = require('cheerio');
const Inliner = require('inliner');
const EPub = require('epub');
const btoa = require('abab').btoa;

router.all('/*', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

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

  const width = req.body.width;
  const height = req.body.height;

  const epub = new EPub(epubPath);

  const unzipPath = req.file.path;
  epub.on('end', () => {
    fs.createReadStream(epubPath)
      .pipe(unzip.Extract({ path: unzipPath }))
      .on('close', () => {
        Promise.all(epub.flow.map((e) => {
            const inject = fs.readFileSync('assets/inject.ejs', 'utf8');
            const html = fs.readFileSync(path.join(unzipPath, e.href), 'utf8');
            const renderedInject = ejs.render(inject, { height, width });
            $ = cheerio.load(html);

            fs.writeFileSync(path.join(unzipPath, e.href), $.html(), 'utf8');
            return inline(path.join(unzipPath, e.href));
          }))
          .then((chapters) => {

            // build the book
            const book = epub.metadata;
            book.chapters = epub.flow.map((e, i) => ({
              title: e.title,
              order: e.order,
              html: btoa(chapters[i]),
            }));

            // build the reader
            const template = fs.readFileSync('assets/reader.ejs', 'utf8');
            const reader = ejs.render(template, {
              book: JSON.stringify(book),
              readerWidth: width,
              readerHeight: height,
            });
            res.send(reader);

            // remove temporary files
            fs.remove(epubPath);
            fs.remove(unzipPath);
          });
      });
  });
  epub.parse();
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
