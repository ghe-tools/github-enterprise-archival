'use strict';

var fs = require('fs');
var path = require('path');

var async = require('async');
var command = require('commander');
var config = require('config');
var moment = require('moment');

var helper = require('./helper');

command
  .description('Prune tarballs from the archives based on aging rules')
  .option('-a, --archives [directory]', 'directory containing archives')
  .parse(process.argv);

var log = helper.logger('github-prune-archives', config.get('log.dir'),
  config.get('log.level'), config.get('log.retention'));

exports = module.exports = {
  /**
   * Is the date less than n days from today
   */
  isDaily: function(date, n, today) {
    var t = moment(today);

    return t.subtract(n, 'days').isBefore(date);
  },

  /**
   * Is the date a Sunday and less than n weeks from today
   */
  isSunday: function(date, n, today) {
    for (var i=0; i<n; i++) {
      var sunday = moment(today);

      sunday.startOf('week').subtract(i, 'weeks');

      if (sunday.isSame(date)) {
        return true;
      }
    }

    return false;
  },

  /**
   * Is the date a first of the month and less than n months from today
   */
  isFirstOfMonth: function(date, n, today) {
    for (var i=0; i<n; i++) {
      var firstOfMonth = moment(today);

      firstOfMonth.startOf('month').subtract(i, 'months');

      if (firstOfMonth.isSame(date)) {
        return true;
      }
    }

    return false;
  },

  /**
   * Is the date a first of the year and less than n years from today
   */
  isFirstOfYear: function(date, n, today) {
    for (var i=0; i<n; i++) {
      var firstOfYear = moment(today);

      firstOfYear.startOf('year').subtract(i, 'years');

      if (firstOfYear.isSame(date)) {
        return true;
      }
    }

    return false;
  },

  /**
   * Prune files that don't match the retention rules
   */
  prune: function(today, days, weeks, months, years, dir, filename, done) {
    var absFilename = path.format({
      dir: dir,
      base: filename
    });

    try {
      var archiveDate = helper.extractDate(absFilename);

      if (exports.isDaily(archiveDate, days, today) ||
        exports.isSunday(archiveDate, weeks, today) ||
        exports.isFirstOfMonth(archiveDate, months, today) ||
        exports.isFirstOfYear(archiveDate, years, today)) {
        log.info('Keeping archive', absFilename);
        done(null, 'keep');
      } else {
        fs.unlink(absFilename, function(err) {
          if (err) {
            // we will retries on the next run
            log.error('Unable to remove archive', absFilename);
            done(null, 'failed');
          } else {
            log.info('Removed archive', absFilename);
            done(null, 'removed');
          }
        });
      }
    } catch (e) {
      log.warn('Skipping unrecognized file', path);
      done(null, 'skipped');
    }
  },

  /**
   * Scan the archive dir to look for files to prune
   */
  scanArchives: function(archives, today, retention) {
    // scan all files in the archive directory
    fs.readdir(archives, function(err, files) {
      if (err) {
        log.error('Cannot read directory', archives);
      } else {
        async.each(files,
          exports.prune.bind(exports.prune, today, retention.days, retention.weeks,
            retention.months, retention.years, archives),
          /* istanbul ignore next */
          function(err) {
            if (err) {
              log.error(err);
            } else {
              log.info('processed', files.length, 'archives');
            }
          }
        );
      }
    });
  }
};

/* istanbul ignore if */
if (process.env.NODE_ENV !== 'test') {
  // fix the date in case this script runs around midnight
  var today = moment();
  var archives = command.archives || config.get('dir.archives');

  exports.scanArchives(archives, today, config.get('retention'));
}

