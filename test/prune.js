'use strict';

var fs = require('fs');

var moment = require('moment');
var should = require('should');
var sinon = require('sinon');

var helper = require('../src/helper');

describe('prune', function() {
  var today = moment('2015-09-16');
  var prune;
  var sandbox;
  var log = {
    trace: sinon.spy(),
    debug: sinon.spy(),
    info: sinon.spy(),
    warn: sinon.spy(),
    error: sinon.spy(),
    fatal: sinon.spy()
  };

  before(function() {
    sinon.stub(helper, 'logger').returns(log);
    prune = require('../src/prune');
  });

  after(function() {
    helper.logger.restore();
  });

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('isDaily()', function() {
    it('should be within the last 3 days', function() {
      prune.isDaily(moment('2015-09-16'), 3, today).should.be.true();
      prune.isDaily(moment('2015-09-15'), 3, today).should.be.true();
      prune.isDaily(moment('2015-09-14'), 3, today).should.be.true();
      prune.isDaily(moment('2015-09-13'), 3, today).should.be.false();
      prune.isDaily(moment('2015-09-12'), 3, today).should.be.false();
    });
  });

  describe('isSunday()', function() {
    it('should be a Sunday', function() {
      prune.isSunday(moment('2015-08-14'), 3, today).should.be.false();
      prune.isSunday(moment('2015-09-12'), 3, today).should.be.false();
    });

    it('should be within 3 weeks', function() {
      prune.isSunday(moment('2015-09-13'), 3, today).should.be.true();
      prune.isSunday(moment('2015-09-06'), 3, today).should.be.true();
      prune.isSunday(moment('2015-08-30'), 3, today).should.be.true();
      prune.isSunday(moment('2015-08-23'), 3, today).should.be.false();
      prune.isSunday(moment('2015-08-20'), 3, today).should.be.false();
    });
  });

  describe('isFirstOfMonth()', function() {
    it('should be a first of the month', function() {
      prune.isFirstOfMonth(moment('2015-09-02'), 3, today).should.be.false();
      prune.isFirstOfMonth(moment('2015-09-01'), 3, today).should.be.true();
      prune.isFirstOfMonth(moment('2015-08-31'), 3, today).should.be.false();
    });

    it('should be within 3 months', function() {
      prune.isFirstOfMonth(moment('2015-09-01'), 3, today).should.be.true();
      prune.isFirstOfMonth(moment('2015-08-01'), 3, today).should.be.true();
      prune.isFirstOfMonth(moment('2015-07-01'), 3, today).should.be.true();
      prune.isFirstOfMonth(moment('2015-06-01'), 3, today).should.be.false();
      prune.isFirstOfMonth(moment('2015-05-01'), 3, today).should.be.false();
    });
  });

  describe('isFirstOfYear()', function() {
    it('should be a first of the month', function() {
      prune.isFirstOfYear(moment('2015-02-01'), 3, today).should.be.false();
      prune.isFirstOfYear(moment('2015-01-02'), 3, today).should.be.false();
      prune.isFirstOfYear(moment('2015-01-01'), 3, today).should.be.true();
      prune.isFirstOfYear(moment('2015-12-31'), 3, today).should.be.false();
    });

    it('should be within 3 months', function() {
      prune.isFirstOfYear(moment('2015-01-01'), 3, today).should.be.true();
      prune.isFirstOfYear(moment('2014-01-01'), 3, today).should.be.true();
      prune.isFirstOfYear(moment('2013-01-01'), 3, today).should.be.true();
      prune.isFirstOfYear(moment('2012-01-01'), 3, today).should.be.false();
      prune.isFirstOfYear(moment('2011-01-01'), 3, today).should.be.false();
    });
  });

  describe('prune()', function() {


    it('should keep archive', function(done) {
      var callback = function(err, res) {
        helper.extractDate.calledOnce.should.be.true();
        prune.isDaily.calledOnce.should.be.true();
        should.not.exist(err);
        res.should.be.equal('keep');
        done();
      };

      sandbox.stub(helper, 'extractDate').returns(today);
      sandbox.stub(prune, 'isDaily').returns(true);

      prune.prune(today, 1, 1, 1, 1, 'a-folder', 'a-file', callback);
    });

    it('should remove archive', function(done) {
      var callback = function(err, res) {
        helper.extractDate.calledOnce.should.be.true();
        prune.isDaily.calledOnce.should.be.true();
        prune.isSunday.calledOnce.should.be.true();
        prune.isFirstOfMonth.calledOnce.should.be.true();
        prune.isFirstOfYear.calledOnce.should.be.true();
        fs.unlink.calledOnce.should.be.true();
        should.not.exist(err);
        res.should.be.equal('removed');
        done();
      };

      sandbox.stub(helper, 'extractDate').returns(today);
      sandbox.stub(prune, 'isDaily').returns(false);
      sandbox.stub(prune, 'isSunday').returns(false);
      sandbox.stub(prune, 'isFirstOfMonth').returns(false);
      sandbox.stub(prune, 'isFirstOfYear').returns(false);
      sandbox.stub(fs, 'unlink').yields();

      prune.prune(today, 1, 1, 1, 1, 'a-folder', 'a-file', callback);
    });

    it('should fail removing archive', function(done) {
      var callback = function(err, res) {
        helper.extractDate.calledOnce.should.be.true();
        prune.isDaily.calledOnce.should.be.true();
        prune.isSunday.calledOnce.should.be.true();
        prune.isFirstOfMonth.calledOnce.should.be.true();
        prune.isFirstOfYear.calledOnce.should.be.true();
        fs.unlink.calledOnce.should.be.true();
        should.not.exist(err);
        res.should.be.equal('failed');
        done();
      };

      sandbox.stub(helper, 'extractDate').returns(today);
      sandbox.stub(prune, 'isDaily').returns(false);
      sandbox.stub(prune, 'isSunday').returns(false);
      sandbox.stub(prune, 'isFirstOfMonth').returns(false);
      sandbox.stub(prune, 'isFirstOfYear').returns(false);
      sandbox.stub(fs, 'unlink').yields('Opps! An Error');

      prune.prune(today, 1, 1, 1, 1, 'a-folder', 'a-file', callback);
    });

    it('should not recognize archive', function(done) {
      var callback = function(err, res) {
        helper.extractDate.calledOnce.should.be.true();
        should.not.exist(err);
        res.should.be.equal('skipped');
        done();
      };

      sandbox.stub(helper, 'extractDate').throws(new Error('Oops! An error'));

      prune.prune(today, 1, 1, 1, 1, 'a-folder', 'a-file', callback);
    });
  });

  describe('scanArchives()', function() {
    it('should process all files', function() {
      var files = ['file-1', 'file-2', 'file-3', 'file-4'];

      sandbox.stub(fs, 'readdir').yields(null, files);
      sandbox.stub(prune, 'prune')
        .onCall(1).yields(null, 'failed')
        .onCall(2).yields(null, 'keep')
        .onCall(1).yields(null, 'skipped')
        .onCall(1).yields(null, 'removed');

      prune.scanArchives('a-folder', today, { days: 1, weeks: 1, months: 1, years: 1 });

      fs.readdir.calledOnce.should.be.true();
      prune.prune.callCount.should.be.equal(4);
    });

    it('should fail reading archive folder', function() {
      sandbox.stub(fs, 'readdir').yields('Oops! An Error');
      sandbox.spy(prune, 'prune');

      prune.scanArchives('a-folder', today, { days: 1, weeks: 1, months: 1, years: 1 });

      fs.readdir.calledOnce.should.be.true();
      prune.prune.callCount.should.be.equal(0);
    });
  });
});
