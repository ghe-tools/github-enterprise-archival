'use strict';

var path = require('path');
var util = require('util');

var bunyan = require('bunyan');
var moment = require('moment');

var TAR_EXT = '.tar';

exports = module.exports = {

  /**
   * Get a logger
   */
  /* istanbul ignore next */
  logger: function(app, dir, level, retention) {
    return bunyan.createLogger({
      name: app,
      streams: [
        {
          level: 'info',
          stream: process.stdout
        }, {
          type: 'rotating-file',
          level: level,
          path: path.format({
            dir: dir,
            base: app + '.log'
          }),
          period: '1w',
          count: retention
        }
      ]
    });
  },

  /**
   * Format the archive filename based on a given date
   * e.g. /dirA/dirB/GitHub-2015-09-16-Wed.tar
   */
  archiveName: function(dir, dateFormat, date) {
    // date is optional, it is then defaulted to today
    return util.format('%s/GitHub-%s%s', dir, moment(date).format(dateFormat), TAR_EXT);
  },

  /**
   * Find the date of the archive based on its filename
   * Files are named as /dirA/dirB/GitHub-2015-09-16-Wed.tar
   */
  extractDate: function(filename) {
    if (path.extname(filename) === TAR_EXT) {
      var basename = path.basename(filename, TAR_EXT);
      var parts = basename.split('-');

      if (parts.length === 5) {
        parts.shift();  // remove Github- prefix of filename
        parts.pop();    // remove -DayOfWeek suffix of filename
        return moment(parts.join('-'));
      } else {
        throw new Error('Malformed filename ' + filename);
      }
    } else {
      throw new Error('Invalid file extension ' + filename);
    }
  },
};