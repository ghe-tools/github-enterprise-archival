'use strict';

var moment = require('moment');
var rewire = require('rewire');
var should = require('should');
var sinon = require('sinon');

var prune = rewire('../src/prune');

describe('prune', function() {
  var today = moment('2015-09-16');
  var sandbox;

  before(function() {
    var log = {
      trace: sinon.spy(),
      debug: sinon.spy(),
      info: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy(),
      fatal: sinon.spy()
    };
    prune.__set__('log', log);
  });

  after(function() {
  });

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('isDaily()', function() {
    it('should be within the last 3 days', function() {
      var isDaily = prune.__get__('isDaily');

      isDaily(moment('2015-09-16'), 3, today).should.be.true();
      isDaily(moment('2015-09-15'), 3, today).should.be.true();
      isDaily(moment('2015-09-14'), 3, today).should.be.true();
      isDaily(moment('2015-09-13'), 3, today).should.be.false();
      isDaily(moment('2015-09-12'), 3, today).should.be.false();
    });
  });

  describe('isSunday()', function() {
    var isSunday = prune.__get__('isSunday');

    it('should be a Sunday', function() {
      isSunday(moment('2015-08-14'), 3, today).should.be.false();
      isSunday(moment('2015-09-12'), 3, today).should.be.false();
    });

    it('should be within 3 weeks', function() {
      isSunday(moment('2015-09-13'), 3, today).should.be.true();
      isSunday(moment('2015-09-06'), 3, today).should.be.true();
      isSunday(moment('2015-08-30'), 3, today).should.be.true();
      isSunday(moment('2015-08-23'), 3, today).should.be.false();
      isSunday(moment('2015-08-20'), 3, today).should.be.false();
    });
  });

  describe('isFirstOfMonth()', function() {
    var isFirstOfMonth = prune.__get__('isFirstOfMonth');

    it('should be a first of the month', function() {
      isFirstOfMonth(moment('2015-09-02'), 3, today).should.be.false();
      isFirstOfMonth(moment('2015-09-01'), 3, today).should.be.true();
      isFirstOfMonth(moment('2015-08-31'), 3, today).should.be.false();
    });

    it('should be within 3 months', function() {
      isFirstOfMonth(moment('2015-09-01'), 3, today).should.be.true();
      isFirstOfMonth(moment('2015-08-01'), 3, today).should.be.true();
      isFirstOfMonth(moment('2015-07-01'), 3, today).should.be.true();
      isFirstOfMonth(moment('2015-06-01'), 3, today).should.be.false();
      isFirstOfMonth(moment('2015-05-01'), 3, today).should.be.false();
    });
  });

  describe('isFirstOfYear()', function() {
    var isFirstOfYear = prune.__get__('isFirstOfYear');

    it('should be a first of the month', function() {
      isFirstOfYear(moment('2015-02-01'), 3, today).should.be.false();
      isFirstOfYear(moment('2015-01-02'), 3, today).should.be.false();
      isFirstOfYear(moment('2015-01-01'), 3, today).should.be.true();
      isFirstOfYear(moment('2015-12-31'), 3, today).should.be.false();
    });

    it('should be within 3 months', function() {
      isFirstOfYear(moment('2015-01-01'), 3, today).should.be.true();
      isFirstOfYear(moment('2014-01-01'), 3, today).should.be.true();
      isFirstOfYear(moment('2013-01-01'), 3, today).should.be.true();
      isFirstOfYear(moment('2012-01-01'), 3, today).should.be.false();
      isFirstOfYear(moment('2011-01-01'), 3, today).should.be.false();
    });
  });

  describe('prune()', function() {
    var error = 'Oops! An Error!';

    it('should keep archive', function(done) {
      var extractDate = sandbox.stub().returns(today);
      var isDaily = sandbox.stub().returns(true);
      var callback = function(err, res) {
        extractDate.calledOnce.should.be.true();
        isDaily.calledOnce.should.be.true();
        should.not.exist(err);
        res.should.be.equal('keep');
        done();
      };

      prune.__set__('isDaily', isDaily);
      prune.__set__('helper', {
        extractDate: extractDate
      });

      var p = prune.__get__('prune');
      p(today, 1, 1, 1, 1, 'a-folder', 'a-file', callback);
    });

    it('should remove archive', function(done) {
      var extractDate = sandbox.stub().returns(today);
      var isDaily = sandbox.stub().returns(false);
      var isSunday = sandbox.stub().returns(false);
      var isFirstOfMonth = sandbox.stub().returns(false);
      var isFirstOfYear = sandbox.stub().returns(false);
      var unlink = sandbox.stub().yields();

      var callback = function(err, res) {
        extractDate.calledOnce.should.be.true();
        isDaily.calledOnce.should.be.true();
        isSunday.calledOnce.should.be.true();
        isFirstOfMonth.calledOnce.should.be.true();
        isFirstOfYear.calledOnce.should.be.true();
        unlink.calledOnce.should.be.true();
        should.not.exist(err);
        res.should.be.equal('removed');
        done();
      };

      prune.__set__('helper', { extractDate: extractDate });
      prune.__set__('isDaily', isDaily);
      prune.__set__('isSunday', isSunday);
      prune.__set__('isFirstOfMonth', isFirstOfMonth);
      prune.__set__('isFirstOfYear', isFirstOfYear);
      prune.__set__('fs', { unlink: unlink });

      var p = prune.__get__('prune');
      p(today, 1, 1, 1, 1, 'a-folder', 'a-file', callback);
    });

    it('should fail removing archive', function(done) {
      var extractDate = sandbox.stub().returns(today);
      var isDaily = sandbox.stub().returns(false);
      var isSunday = sandbox.stub().returns(false);
      var isFirstOfMonth = sandbox.stub().returns(false);
      var isFirstOfYear = sandbox.stub().returns(false);
      var unlink = sandbox.stub().yields(error);

      var callback = function(err, res) {
        extractDate.calledOnce.should.be.true();
        isDaily.calledOnce.should.be.true();
        isSunday.calledOnce.should.be.true();
        isFirstOfMonth.calledOnce.should.be.true();
        isFirstOfYear.calledOnce.should.be.true();
        unlink.calledOnce.should.be.true();
        should.not.exist(err);
        res.should.be.equal('failed');
        done();
      };

      prune.__set__('helper', { extractDate: extractDate });
      prune.__set__('isDaily', isDaily);
      prune.__set__('isSunday', isSunday);
      prune.__set__('isFirstOfMonth', isFirstOfMonth);
      prune.__set__('isFirstOfYear', isFirstOfYear);
      prune.__set__('fs', { unlink: unlink });

      var p = prune.__get__('prune');
      p(today, 1, 1, 1, 1, 'a-folder', 'a-file', callback);
    });

    it('should not recognize archive', function(done) {
      var extractDate = sandbox.stub().throws(new Error('Oops! An error'));

      var callback = function(err, res) {
        extractDate.calledOnce.should.be.true();
        should.not.exist(err);
        res.should.be.equal('skipped');
        done();
      };

      prune.__set__('helper', { extractDate: extractDate });

      var p = prune.__get__('prune');
      p(today, 1, 1, 1, 1, 'a-folder', 'a-file', callback);
    });
  });

  describe('scanArchives()', function() {
    it('should process all files', function() {
      var files = ['file-1', 'file-2', 'file-3', 'file-4'];
      var readdir = sandbox.stub().yields(null, files);
      var p = sandbox.spy();

      prune.__set__('fs', { readdir: readdir });
      prune.__set__('prune', p);

      var scanArchives = prune.__get__('scanArchives');
      scanArchives('a-folder', today, { days: 1, weeks: 1, months: 1, years: 1 });

      readdir.calledOnce.should.be.true();
      p.callCount.should.be.equal(4);
    });

    it('should fail reading archive folder', function() {
      var readdir = sandbox.stub().yields('Oops! An Error');
      var p = sandbox.spy(p);

      prune.__set__('fs', { readdir: readdir });
      prune.__set__('prune', p);

      var scanArchives = prune.__get__('scanArchives');
      scanArchives('a-folder', today, { days: 1, weeks: 1, months: 1, years: 1 });

      readdir.calledOnce.should.be.true();
      p.callCount.should.be.equal(0);
    });
  });
});
