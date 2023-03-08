/* ==========
IMPORTS
========== */
const express = require('express');
const chalk = require('chalk');
const Watcher = require('./lib/watcher');
const Logger = require('./lib/logger');
const { FileExplorer } = require('./lib/files');
const config = require('./config');
const { readFileSync } = require('fs');

/* ==========
MARKDOWN
========== */
const root = `${__dirname}/docs`;
const explorer = new FileExplorer(`${__dirname}/docs`);
const sitemap = explorer.createTree();
// console.log(sitemap);
// console.log(explorer.docs);

const watcher = new Watcher('./docs');
const loggers = {
  server: new Logger('SERVER'),
  docs: new Logger('DOCS')
};

watcher
  .on('change', (path) => {
    explorer.update(path);
    loggers.docs.log(chalk.blue('Updated ' + path));
  })
  .on('add', (path) => {
    // explorer.add(path);
    // addFile(path.substring(4));
  });

loggers.docs.log(chalk.yellow('Parsing docs'));

/* ==========
SERVER
========== */
const app = express();
const configToString = JSON.stringify({ ...config, sitemap });

app.get(/^\/api\/doc.+$/, (req, res) => {
  const path = req.path.substring(8);
  res
    .status(200)
    .json(
      Object.assign(
        explorer.docs.get(path) || {},
        { exists: explorer.docs.has(path), path: path }
      ),
    );
});

app.use(express.static('public'));

app.get('**', (req, res) => {
  switch (req.path) {
    case '/index.css':
      return res.sendFile(`${__dirname}/www/index.css`);
    case '/index.js':
      return res.sendFile(`${__dirname}/www/index.js`);
    default:
      return res.send(
        readFileSync(`${__dirname}/www/index.html`)
          .toString()
          .replace(/\$CONFIG/g, configToString)
      );
  }
});


app.listen(80, () => {
  loggers.server.log(chalk.green('Listening for requests.'));
  loggers.docs.log(chalk.yellow('Listening to changes in docs'));
});
