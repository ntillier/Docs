const chalk = require('chalk');

class Logger {
  constructor (prefix) {
    this.prefix = chalk.dim(prefix);
  }

  log (txt) {
    console.log(`[${this.prefix}]: ${txt}`);
  }
}

module.exports = Logger;