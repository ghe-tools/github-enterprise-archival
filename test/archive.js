'use strict';

var fs = require('fs');
var os = require('os');
var PassThrough = require('stream').PassThrough;

var nodemailer = require('nodemailer');
var sinon = require('sinon');
var should = require('should');
var tar = require('tar-fs');

var helper = require('../src/helper');

describe('archive', function() {
  var archive;
  var sandbox;
  var error = 'Oops! An Error';
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
    archive = require('../src/archive');
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

  describe('alert()', function(done) {
    it('should fail sending email', function(done) {
      var sendMail = sandbox.stub().yields(error);
      var callback = function(err, res) {
        sendMail.calledOnce.should.be.true();
        err.should.be.equal(error);
        should.not.exist(res);
        done();
      };

      sandbox.stub(nodemailer, 'createTransport', function() {
        return {
          sendMail: sendMail
        }
      });

      archive.alert(['user1@gmail.com', 'user2@gmail.com'], 'a-sender@gmail.com',
        'a-snapshot', 'an-archive', callback);
    });

    it('should send email to 2 recipients', function(done) {
      var sendMail = sandbox.stub().yields();
      var callback = function(err, res) {
        sendMail.calledOnce.should.be.true();
        sendMail.calledWith({
          from: 'a-sender@gmail.com',
          to: 'user1@gmail.com,user2@gmail.com',
          subject: 'GHE Snapshot Archiving Failed!',
          text: 'Unable to create archive an-archive from snapshot at a-snapshot.\n',
        })
        should.not.exist(err);
        done();
      };

      sandbox.stub(nodemailer, 'createTransport', function() {
        return {
          sendMail: sendMail
        }
      });

      archive.alert(['user1@gmail.com', 'user2@gmail.com'], 'a-sender@gmail.com',
        'a-snapshot', 'an-archive', callback);
    });
  });

  describe('tarball()', function() {
    it('should follow symlink', function() {
      var realpath = 'the-real-path';

      sandbox.stub(fs, 'realpath').yields(null, realpath);
      sandbox.spy(fs, 'createWriteStream');
      sandbox.stub(tar, 'pack').returns({ pipe: sinon.stub() });

      archive.tarball('the-symlink', os.tmpdir() + '/tarball.tar');

      fs.createWriteStream.calledOnce.should.be.true();
      tar.pack.calledWith(realpath).should.be.true();
    });

    it('should tar snapshot', function(done) {
      this.timeout(5000);

      var ws = new PassThrough();
      var callback = function(err, res) {
        should.not.exist(err);
        archive.alert.callCount.should.be.equal(0);
        done();
      };

      sandbox.stub(fs, 'createWriteStream').returns(ws);
      sandbox.stub(archive, 'alert');

      archive.tarball('test', '/archives/GitHub-2015-09-16-Wed.tar', callback);
      ws.emit('finish');
    });

    it('should not find snapshot', function(done) {
      this.timeout(5000);

      var ws = new PassThrough();
      var callback = function(err, res) {
        err.should.be.equal(error);
        should.not.exist(res);
        done();
      };

      sandbox.stub(fs, 'realpath').yields(error);
      sandbox.stub(fs, 'createWriteStream').returns(ws);
      sandbox.stub(archive, 'alert');

      archive.tarball('test', '/archives/GitHub-2015-09-16-Wed.tar', callback);
    });

    it('should send an alert on failure', function(done) {
      this.timeout(5000);

      var ws2 = new PassThrough();
      var tarball = '/archives/GitHub-2015-09-16-Wed.tar';
      var error = 'Oops! An error';
      var callback = function(err, res) {
        should.not.exist(res);
        err.should.be.equal(error);
        archive.alert.calledOnce.should.be.true();
        archive.alert.calledWith(['github-ops@your-company-name.com'],
          'github@your-company-name.com', 'test', tarball).should.be.true();
        done();
      };

      sandbox.stub(fs, 'createWriteStream').returns(ws2);
      sandbox.stub(archive, 'alert').yields();

      archive.tarball('test', tarball, callback);
      ws2.emit('error', error);
    });
  });

});

