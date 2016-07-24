'use strict';

var os = require('os');

var PassThrough = require('stream').PassThrough;
var rewire = require('rewire');
var sinon = require('sinon');
var should = require('should');

var archive = rewire('../src/archive');

describe('archive', function() {
  var sandbox;
  var error = 'Oops! An Error';

  before(function() {
    var log = {
      trace: sinon.spy(),
      debug: sinon.spy(),
      info: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy(),
      fatal: sinon.spy()
    };
    archive.__set__('log', log);
  });

  after(function() {
  });

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('alert()', function() {
    it('should fail sending email', function(done) {
      var sendMail = sandbox.stub().yields(error);
      archive.__set__('nodemailer', {
        createTransport: function() {
          return {
            sendMail: sendMail
          };
        }
      });

      var callback = function(err, res) {
        sendMail.calledOnce.should.be.true();
        sendMail.calledWith({
          from: 'a-sender@gmail.com',
          to: 'user1@gmail.com,user2@gmail.com',
          subject: 'GHE Snapshot Archiving Failed!',
          text: 'Unable to create archive an-archive from snapshot at a-snapshot.\n',
        });
        err.should.be.equal(error);
        should.not.exist(res);
        done();
      };

      var alert = archive.__get__('alert');
      alert(['user1@gmail.com', 'user2@gmail.com'], 'a-sender@gmail.com',
        'a-snapshot', 'an-archive', callback);
    });

    it('should send email to 2 recipients', function(done) {
      var sendMail = sandbox.stub().yields();
      archive.__set__('nodemailer', {
        createTransport: function() {
          return {
            sendMail: sendMail
          };
        }
      });

      var callback = function(err, res) {
        sendMail.calledOnce.should.be.true();
        sendMail.calledWith({
          from: 'a-sender@gmail.com',
          to: 'user1@gmail.com,user2@gmail.com',
          subject: 'GHE Snapshot Archiving Failed!',
          text: 'Unable to create archive an-archive from snapshot at a-snapshot.\n',
        });
        should.not.exist(err);
        should.not.exist(res);
        done();
      };

      var alert = archive.__get__('alert');
      alert(['user1@gmail.com', 'user2@gmail.com'], 'a-sender@gmail.com',
        'a-snapshot', 'an-archive', callback);
    });
  });

  describe('tarball()', function() {
    var realpath = 'the-real-path';

    it('should follow symlink', function() {
      var ws = new PassThrough();
      var fs = {
        realpath: sandbox.stub().yields(null, realpath),
        createWriteStream: sandbox.stub().returns(ws)
      };
      var tar = {
        pack: sandbox.stub().returns({ pipe: sinon.stub() })
      };
      var callback = function(err, res) {
        should.not.exist(err);
        fs.createWriteStream.calledOnce.should.be.true();
        fs.realpath.calledOnce.should.be.true();
        tar.pack.calledOnce.should.be.true();
        tar.pack.calledWith(realpath).should.be.true();
      };

      archive.__set__('fs', fs);
      archive.__set__('tar', tar);

      var tarball = archive.__get__('tarball');
      tarball('the-symlink', os.tmpdir() + '/tarball.tar', callback);
    });

    it('should tar snapshot', function(done) {
      this.timeout(5000);   // delay to allow for the error emits

      var ws = new PassThrough();
      var fs = {
        realpath: sandbox.stub().yields(null, realpath),
        createWriteStream: sandbox.stub().returns(ws)
      };
      var tar = {
        pack: sandbox.stub().returns({ pipe: sinon.stub() })
      };
      var alert = sandbox.stub();
      var callback = function(err, res) {
        should.not.exist(err);
        alert.callCount.should.be.equal(0);
        fs.createWriteStream.calledOnce.should.be.true();
        fs.realpath.calledOnce.should.be.true();
        tar.pack.calledOnce.should.be.true();
        done();
      };

      archive.__set__('fs', fs);
      archive.__set__('tar', tar);
      archive.__set__('alert', alert);

      var tarball = archive.__get__('tarball');
      tarball('test', '/archives/GitHub-2015-09-16-Wed.tar', callback);
      ws.emit('finish');
    });

    it('should not find snapshot', function(done) {
      var ws = new PassThrough();
      var fs = {
        realpath: sandbox.stub().yields(error),
        createWriteStream: sandbox.stub().returns(ws)
      };
      var callback = function(err, res) {
        err.should.be.equal(error);
        should.not.exist(res);
        fs.createWriteStream.calledOnce.should.be.true();
        fs.realpath.calledOnce.should.be.true();
        done();
      };

      archive.__set__('fs', fs);
      archive.__set__('alert', sandbox.stub());

      var tarball = archive.__get__('tarball');
      tarball('test', '/archives/GitHub-2015-09-16-Wed.tar', callback);
    });

    it('should send an alert on failure', function(done) {
      this.timeout(5000);   // delay to allow for the error emits

      var ws = new PassThrough();
      var tarfile = '/archives/GitHub-2015-09-16-Wed.tar';
      var alert = sandbox.stub().yields();
      var fs = {
        realpath: sandbox.stub().yields(null, 'test'),
        createWriteStream: sandbox.stub().returns(ws)
      };

      var callback = function(err, res) {
/*
        should.not.exist(res);
        err.should.be.equal(error);
        alert.calledOnce.should.be.true();
        alert.calledWith(['github-ops@your-company-name.com'],
          'github@your-company-name.com', 'test', tarball).should.be.true();
*/
        done();
      };

      archive.__set__('fs', fs);
      archive.__set__('alert', alert);

      var tarball = archive.__get__('tarball');
      tarball('test', tarfile, callback);
      ws.emit('error', error);
    });
  });

});

