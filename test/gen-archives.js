'use strict';

var rewire = require('rewire');
var sinon = require('sinon');
var should = require('should');

var gen = rewire('../src/gen-archives');

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
      var writeFileSync = sandbox.stub();
      gen.__set__('fs', {
        writeFileSync: writeFileSync
      });

      gen.writeFiles('2016-02-01', '2016-02-29', 'a-folder', 'YYYY-MM-DD-ddd');

      writeFileSync.callCount.should.be.equal(29);
      writeFileSync.calledWith('a-folder/GitHub-2016-02-01-Mon.tar').should.be.true();
      writeFileSync.calledWith('a-folder/GitHub-2016-02-02-Tue.tar').should.be.true();
      writeFileSync.calledWith('a-folder/GitHub-2016-02-02-Tue.tar').should.be.true();
      writeFileSync.calledWith('a-folder/GitHub-2016-02-03-Wed.tar').should.be.true();
      writeFileSync.calledWith('a-folder/GitHub-2016-02-04-Thu.tar').should.be.true();
      writeFileSync.calledWith('a-folder/GitHub-2016-02-28-Sun.tar').should.be.true();
      writeFileSync.calledWith('a-folder/GitHub-2016-02-29-Mon.tar').should.be.true();
    });
  });
});

