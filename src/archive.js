'use strict';

var fs = require('fs');
var util = require('util');

var command = require('commander');
var config = require('config');
var moment = require('moment');
var nodemailer = require('nodemailer');
var tar = require('tar-fs');

var helper = require('./helper');

command
  .description('Create tarballs from Github snapshots')
  .option('-d, --dir [directory]', 'snapshot directory to archive')
  .parse(process.argv);

var log = helper.logger('github-archive', config.get('log.dir'),
  config.get('log.level'), config.get('log.retention'));

exports = module.exports = {
  /**
   * Alert that a failure occured by sending an email to a number of recipients
   */
  alert: function(recipients, sender, snapshot, archive, done) {
    log.debug('Sending alert email to', recipients);

    nodemailer.createTransport().sendMail({
      from: sender,
      to: recipients.join(','),
      subject: 'GHE Snapshot Archiving Failed!',
      text: util.format('Unable to create archive %s from snapshot at %s.\n',
        archive, snapshot)
    }, function(err, res) {
      if (err) {
        log.error('Cannot send alert email to', recipients, err);
        done(err);
      } else {
        log.info('Alert email sent to', recipients);
        done();
      }
    });
  },

  /**
   * Create a tarball from a Github snapshot
   */
  tarball: function(snapshot, archive, done) {
    // create the stream first (before resolving the path)
    // to make timing of firing of events easier in unit tests
    var ws = fs.createWriteStream(archive)
      .on('error', function(err) {
        log.error('Cannot write to file', archive, err);

        exports.alert(config.get('email.recipients'), config.get('email.sender'),
          snapshot, archive, function(err1, res1) {
            // best effort to send the email
            done(err);
          });
      })
      .on('finish', function() {
        log.info('Directory', snapshot, 'archived to file', archive);
        done();
      });

    fs.realpath(snapshot, function(err, path) {
      if (err) {
        log.error('Invalid snapshot location', snapshot, err);
        done(err);
      } else {
        /* istanbul ignore else */
        if (snapshot !== path) {
          log.info(snapshot, 'resolves to', path);
          snapshot = path;
        }

        log.debug('Archiving directory', snapshot, 'to file', archive);
        log.info('Creating tarball', archive);
        tar.pack(snapshot).pipe(ws);
      }
    });
  },
};

/* istanbul ignore else */
if (process.env.NODE_ENV !== 'test') {
  var archive = helper.archiveName(config.get('dir.archives'), config.get('date-format'), moment());
  var snapshot = command.dir || config.get('dir.snapshot');

  exports.tarball(snapshot, archive, function(err, res) {
    if (err) {
      log.error('Failed to create an archive');
    } else {
      log.info('Archival for the snapshot completed!', res);
    }
  });
}
