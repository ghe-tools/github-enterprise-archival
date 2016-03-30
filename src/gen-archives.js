'use strict';

var fs = require('fs');

var command = require('commander');
var config = require('config');
var moment = require('moment');

var helper = require('./helper');

command
  .description('Generate fake archives file for testing')
  .option('-s, --start [date]', 'the start date to generate files from')
  .option('-e, --end [date]', 'the last date to generate files. The default is today')
  .parse(process.argv);

exports = module.exports = {
  /**
   * Generate archive files between start and end dates
   * The file names looks like GitHub-2015-09-16-Wed.tar
   */
  writeFiles: function(start, end, dir, format) {
    start = moment(start);
    end = moment(end);

    /* istanbul ignore if */
    if (!start.isValid() || !end.isValid()) {
      throw new Error('Incorrect start or end dates');
    } else {
      var i = start;

      while (i.isBefore(end) || i.isSame(end)) {
        var archive = helper.archiveName(dir, format, i.format('YYYY-MM-DD'));

        console.log('Creating archive', archive);
        fs.writeFileSync(archive, 'some fake archive content');

        i.add(1, 'days');
      }
    }
  }
};

/* istanbul ignore if */
if (process.env.NODE_ENV !== 'test') {
  if (!command.start) {
    console.log('--start parameter is required');
    command.help();
  }

  exports.writeFiles(command.start, command.end, config.get('dir.archives'), config.get('date-format'));
}