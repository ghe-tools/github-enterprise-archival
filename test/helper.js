'use strict';

var should = require('should');

var helper = require('../src/helper');

describe('helper', function() {

  describe('archiveName()', function() {
    it('should get filenames like Github-YYYY-MM-DD-ddd.tar', function() {
      var dateFormat = 'YYYY-MM-DD-ddd';
      var dir = '/archives';

      helper.archiveName(dir, dateFormat, '2015-09-16').should.be.equal(dir + '/GitHub-2015-09-16-Wed.tar');
      helper.archiveName(dir, dateFormat, '2015-09-18').should.be.equal(dir + '/GitHub-2015-09-18-Fri.tar');
    });
  });

  describe('extractDate()', function() {
    it('should get a date from filename', function() {
      helper.extractDate('GitHub-2015-09-16-Wed.tar').format('YYYY/MM/DD').should.be.equal('2015/09/16');
      helper.extractDate('/archives/GitHub-2015-09-16-Wed.tar').format('YYYY/MM/DD').should.be.equal('2015/09/16');
      helper.extractDate('GitHub-2015-09-18-Fri.tar').format('YYYY/MM/DD').should.be.equal('2015/09/18');
      helper.extractDate('/backups/archives/GitHub-2015-09-18-Fri.tar').format('YYYY/MM/DD').should.be.equal('2015/09/18');
      helper.extractDate('/backups/archives.folder/GitHub-2015-09-18-Fri.tar').format('YYYY/MM/DD').should.be.equal('2015/09/18');
      helper.extractDate('/backups/archives-folder/GitHub-2015-09-18-Fri.tar').format('YYYY/MM/DD').should.be.equal('2015/09/18');
    });

    it('should throw an exception with malformed filenames', function() {
      helper.extractDate.bind(null, 'GitHub-2015-09-18-Fri').should.throw('Invalid file extension GitHub-2015-09-18-Fri');
      helper.extractDate.bind(null, 'GitHub-2015-09-18-Fri.tar.bogus').should.throw('Invalid file extension GitHub-2015-09-18-Fri.tar.bogus');
      helper.extractDate.bind(null, 'GitHub-2015-09-18-Fri-bogus.tar').should.throw('Malformed filename GitHub-2015-09-18-Fri-bogus.tar');
    });

    it('should flag invalid dates', function() {
      helper.extractDate('GitHub-2015-09-50-Wed.tar').isValid().should.be.false();
      helper.extractDate('GitHub-2015-50-09-Wed.tar').isValid().should.be.false();
    });
  });
});

