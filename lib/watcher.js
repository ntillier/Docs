const chokidar = require('chokidar');

class Watcher {
  constructor(path) {
    this.watcher = chokidar.watch(path, {
      ignoreInitial: true
    });
  }
  
  on (evt, fn) {
    this.watcher.on(evt, this.callback.bind(this, fn));
    return this;
  }
  
  callback (fn, ...args) {
    fn(...args);
  }
}

/*.on('ready', () => {
        console.log(chalk.yellow('\nListening to changes in docs'));
      })
      .on('change', (path) => {
        addFile(path.substring(4));
      })
      .on('unlink', (path) => {
        docs.delete(getPath(path));
        console.log(chalk.blue('Removed ' + getPath(path)))
      })
      .on('add', (path) => {
        addFile(path.substring(4));
      });*/

module.exports = Watcher;