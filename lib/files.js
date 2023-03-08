const { readdirSync, readFileSync, lstatSync, existsSync } = require('fs');
const matter = require('gray-matter');
const marked = require('marked');
const chalk = require('chalk');

const markedAdmonition = require('marked-admonition-extension');
const extendedTables = require("marked-extended-tables");
const markedLinkifyIt = require('marked-linkify-it');
marked.use(markedAdmonition.default);
marked.use(extendedTables());
marked.use(markedLinkifyIt({}, {}));

const renderer = new marked.Renderer();
renderer.link = (href, title, text) => {
  return `<a target="_blank" href="${href}" title="${title}">${text}</a>`;
}

marked.setOptions({ renderer });

const textToPath = str => str.toLowerCase().replace(/[^A-Za-z0-9\.]+/g, '-').replace(/-$|^-/g, '');

class FileExplorer {
  constructor (base) {
    this.base = base;
    this.docs = new Map();
    this.converter = new Map();
    this.folders = new Map();
  }

  addFile (file, priv, parent) {
    if (!/^.+\.md$/.test(priv)) {
      return console.log(chalk.red(`[ERROR]: ${priv} isn't a markdown file. Markdown files should end with ${chalk.bold('.md')}`));
    }
    let { content, data } = matter(readFileSync(priv).toString());
    let pub = `${ parent.public }/${ data.slug ? data.slug.substring(1) : 
textToPath(file.slice(0, -3)) }`.replace(/(?!^)\/$/, '');
    let label = data.title || (/^\#{1,6}\s*([^\#]*)\s*(?:\#{1,6})?$/m.exec(content) || [null, null])[1] || pub.slice(this.base.length, -3);

    this.converter.set(priv, pub);
    this.docs.set(pub, {
      content: marked.parse(content),
      data: data,
      label: label,
    });

    return {
      link: pub,
      label: label,
      type: 0,
      index: data.index || 'no-index'
    };
  }

  iterate (parent) {
    const files = readdirSync(`${this.base}${parent.private}`);
    const map = [];
    let priv, pub, config;
    for (let i of files) {
      priv = `${this.base}${parent.private}/${i}`;
      if (lstatSync(priv).isFile()) {
        if (i !== 'config.json') {
          map.push(this.addFile(i, priv, parent));
        }
      } else {
        try {
          if (existsSync(`${priv}/config.json`)) {
            config = JSON.parse(readFileSync(`${priv}/config.json`).toString());
          } else {
            config = {};
          }
        } catch (_) {
          console.log(chalk.red(`[ERROR]: ${priv}/config.json malformed. It should be valid JSON`));
          config = {};
        }
        pub = `${ parent.public }/${ config.slug || textToPath(i) }`;
        this.folders.set(pub, {
          label: config.label || i,
        });
        map.push({
          type: 1,
          link: pub,
          label: config.label || i,
          index: config.index || 'no-index',
          childrens: this.iterate({
            public: pub,
            private: priv.substring(this.base.length)
          })
        });
      }
    }

    // console.log(map);

    return map
      .filter(Boolean)
      .sort((a, b) => {
        if (a.type === b.type) {
          return (a.index || Infinity) - (b.index || Infinity);
        }
        return a.type - b.type;
      });
  }

  createTree () {
    return this.iterate({ public: '', private: '' });
  }

  update (p) {
    const path = `${__dirname.slice(0, -4)}/${p}`;
    if (this.converter.has(path)) {
      const link = this.converter.get(path);
      const old = this.docs.get(link);
      old.content = marked.parse(matter(readFileSync(path).toString()).content);
      this.docs.set(link, old);
    }
  }

  remove (p) {
    const path = `${__dirname.slice(0, -4)}/${p}`;
    const link = this.converter.get(path);

    if (link) {
      this.converter.delete(path);
      this.docs.delete(link);
    }
  }
}

module.exports = { FileExplorer };