'use strict';

var fs = require('fs');
var os = require('os');

var sinon = require('sinon');
var should = require('should');

var gen = require('../src/gen-archives');

describe('gen-archives', function() {
  var sandbox ;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('writeFiles()', function() {
    it('should produce 29 archives for February 2016', function() {
      sandbox.stub(fs, 'writeFileSync');

      gen.writeFiles('2016-02-01', '2016-02-29', 'a-folder', "YYYY-MM-DD-ddd");

      fs.writeFileSync.callCount.should.be.equal(29);
      fs.writeFileSync.calledWith('a-folder/GitHub-2016-02-01-Mon.tar').should.be.true();
      fs.writeFileSync.calledWith('a-folder/GitHub-2016-02-02-Tue.tar').should.be.true();
      fs.writeFileSync.calledWith('a-folder/GitHub-2016-02-02-Tue.tar').should.be.true();
      fs.writeFileSync.calledWith('a-folder/GitHub-2016-02-03-Wed.tar').should.be.true();
      fs.writeFileSync.calledWith('a-folder/GitHub-2016-02-04-Thu.tar').should.be.true();
      fs.writeFileSync.calledWith('a-folder/GitHub-2016-02-28-Sun.tar').should.be.true();
      fs.writeFileSync.calledWith('a-folder/GitHub-2016-02-29-Mon.tar').should.be.true();
    });
  });
});

