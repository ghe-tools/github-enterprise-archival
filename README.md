[![Build Status](https://travis-ci.org/ghe-tools/github-enterprise-archival.svg?branch=master)](http://img.shields.io/travis/ghe-tools/github-enterprise-archival.svg)
[![Coverage Status](https://coveralls.io/repos/github/ghe-tools/github-enterprise-archival/badge.svg?branch=master)](https://img.shields.io/coveralls/ghe-tools/github-enterprise-archival.svg)

# github-enterprise-archival

This tool archives daily snapshots of GitHub Enterprise (GHE) and retains copies
according to the aging policy. Each copy is a self-contained archive with all
necessary data to restore GHE to a specific point in time.

This tool is intended to be running on the server holding the snapshots produced by `ghe-backup`
distributed as part of [GitHub Enterprise Backup Utils](https://github.com/github/backup-utils).

## Setup

```
$ git clone git@github.com:intuit/github-enterprise-archival.git
$ cd github-archival
$ npm install
```

Copy `config/default-example.json` to `config/default.json` and edit the values as needed

```
$ cp config/default-example.json config/default.json
$ vi config/default.json
```

## Usage

### Create Snapshots

First we need to produce a snapshot. The `ghe-backup` script in [GitHub Enterprise Backup Utils](https://github.com/github/backup-utils) exports GHE data and settings into a local directory.

Refer to the documentation at the link above to configure and run `ghe-backup`


### Create Archives

Then, we create a new archive from the snapshot taken by `ghe-backup`. An archive is tarball of a snapshot.

    $ node src/archive --directory=/var/data/ghe/snapshots/current

Or

    $ npm run archive --directory=/var/data/ghe/snapshots/current

A new tarball is created in the archives folder (see config file).  Archives accumulate in that folder until pruned.

### Prune Archives

Next, we need to prune archives according to our retention policy. These tarballs tend to be
very large requiring lot of disk space.  Thus it is not cost effective to keep one every day.

For example, we can configure the pruning to keep only one for each the last 7 days, 4 of the last weekly copies, 12 of the last monthly copies, and one yearly copy for every year.

Daily, weekly, monthly, and yearly copies are all the same snapshot. What we call a weekly copy is the daily copy taken on a Sunday. A monthly copy is a daily copy taken on a 1st of a month. A yearly copy is a daily copy taken on a January 1st.

    $ node src/prune --directory /var/data/ghe/nightly-archives

Or

    $ npm run prune --directory /var/data/ghe/nightly-archives

### Testing

To run the unit tests

    $ npm test

To obtain code coverage

    $ npm run cover

Coverage results are stored in `./coverage` folder

For functional test of the pruning operation, we can create dummy archives by running

    $ node src/gen-archives --start 2016-02-01 --end 2016-02-29

Or

    $ npm run gen -s 2016-02-01 -e 2016-02-29

The command above generate 29 files, one for each day of February (e.g. GitHub-2016-02-01-Mon.tar)

### Cron

It is best to have cron jobs to run these 2 operations every night.  For example if this app is installed in `/opt/ghe/archival`, the entry for the crontab would look like this:

```
07 02 * * * root /opt/ghe/archival/check-process.sh archive.js || NODE_PATH=/opt/ghe/archival/node_modules NODE_CONFIG_DIR=/opt/ghe/archival/config /path-to-nodejs/bin/node /opt/ghe/archival/src/archive.js
39 02 * * * root /opt/ghe/archival/check-process.sh prune.js || /opt/ghe/archival/check-process.sh archive.js || NODE_PATH=/opt/ghe/archival/node_modules NODE_CONFIG_DIR=/opt/ghe/archival/config /path-to-nodejs/bin/node /opt/ghe/archival/src/prune.js
```
It runs the archive operation at 2:07am everyday if it is not currently running, and the pruning operation at 2:39am everyday if there's no archive and prune operations currently ongoing


## Config File

* `date-format`: format of the archive filename. This format must clearly distiguish the day the archive was produced.
* `dir.snapshot`: directory containing the snapshot to archive. Typically it should be the `current` folder created by `ghe-backup`.
* `dir.archives`: directory where produced archives must be stored.
* `retention.days`: keep copies of the last N days (daily backups).
* `retention.week`: keep copies of the last N Sundays (weekly backups).
* `retention.months`: keep copies of the last N 1st of the month (monthly backups).
* `retention.years`: keep copies of the last N 1st of the year (yearly backups).
* `email.sender`: email address to use when sending alert emails.
* `email.recipients`: list of email addresses to send the alert to.
* `log.dir`: log directory location.
* `log.level`: level of details going into the log file.
* `log.retention`: number of log files to keep as they rotate (once a week).

For example, with this config file

```
{
  "date-format": "YYYY-MM-DD-ddd",
  "dir": {
    "snapshot": "/var/data/ghe/snapshots/current",
    "archives": "/var/data/ghe/nightly-archives"
  },
  "retention": {
    "days": 7,
    "weeks": 4,
    "months": 12,
    "years": 1000
  },
  "email": {
    "sender": "github@your-company-name.com",
    "recipients": ["github-ops@your-company-name.com", "noc@your-company-name.com"]
  },
  "log": {
    "dir": "/var/log/github-tools",
    "level": "trace",
    "retention": 10
  }
}
```

We get:

* Snapshots can be found at `/var/data/ghe/snapshots/current`
* Archives files are stored in `/var/data/ghe/nightly-archives`
* Archives files are named as `GitHub-2015-09-16-Wed.tar`
* Keep 7 archives, one for each of the last 7 days
* Keep 4 archives, one for each of the last 4 Sundays
* Keep 12 archives, one for each of the last 12 first of the month
* Keep 1000 archives, one for each of the last 1000 first of the year
* Logs are stored in `/var/log/github-tools`
* Keep last 10 logs files, one for each week