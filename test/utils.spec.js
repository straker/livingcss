/*jshint -W030 */

var expect = require('chai').expect;
var sinon = require('sinon');
var proxyquire = require('proxyquire');

// stubs
var fsStub = {
  writeFile: function(file, data, options, callback) { callback(null); },
  readFile: function(file, options, callback) { callback(null, ''); }
};

var utils = proxyquire('../lib/utils', {
  fs: fsStub
});

describe('utils', function() {

  // --------------------------------------------------
  // generateSortOrder
  // --------------------------------------------------
  describe('generateSortOrder', function() {

    it('should generate sort order of just pages: array of page names', function() {
      var sortOrder = ['Page One', 'Page Two', 'Page Three'];
      var context = {};

      utils.generateSortOrder(context, sortOrder);

      expect(context.pageOrder).to.deep.equal(['page one', 'page two', 'page three']);
    });

    it('should generate sort order of just sections: object of page names to array of section names', function() {
      var sortOrder = {
        'Page One': ['Section One', 'Section Two'],
        'Page Two': ['Section Three'],
        'Page Three': []
      };
      var context = {
        pages: {
          'Page One': {},
          'Page Two': {},
          'Page Three': {}
        }
      };

      utils.generateSortOrder(context, sortOrder);

      expect(context.pages['Page One']).to.deep.equal({
        sectionOrder: ['section one', 'section two']
      });
      expect(context.pages['Page Two']).to.deep.equal({
        sectionOrder: ['section three']
      });
      expect(context.pages['Page Three']).to.deep.equal({
        sectionOrder: []
      });
    });

    it('should generate sort order of an array of pages names inside the array', function() {
      var sortOrder = [['Page One', 'Page Two', 'Page Three']];
      var context = {};

      utils.generateSortOrder(context, sortOrder);

      expect(context.pageOrder).to.deep.equal(['page one', 'page two', 'page three']);
    });

    it('should generate sort order of both: array of objects of page names to array of section names', function() {
      var sortOrder = [
        {'Page One': ['Section One', 'Section Two']},
        {'Page Two': ['Section Three']},
        {'Page Three': []}
      ];
      var context = {
        pages: {
          'Page One': {},
          'Page Two': {},
          'Page Three': {}
        }
      };

      utils.generateSortOrder(context, sortOrder);

      expect(context.pageOrder).to.deep.equal(['page one', 'page two', 'page three']);
      expect(context.pages['Page One']).to.deep.equal({
        sectionOrder: ['section one', 'section two']
      });
      expect(context.pages['Page Two']).to.deep.equal({
        sectionOrder: ['section three']
      });
      expect(context.pages['Page Three']).to.deep.equal({
        sectionOrder: []
      });
    });

    it('should generate sort order of some: array of objects and strings', function() {
      var sortOrder = [
        {'Page One': ['Section One', 'Section Two']},
        {'Page Two': ['Section Three']},
        'Page Three'
      ];
      var context = {
        pages: {
          'Page One': {},
          'Page Two': {},
          'Page Three': {}
        }
      };

      utils.generateSortOrder(context, sortOrder);

      expect(context.pageOrder).to.deep.equal(['page one', 'page two', 'page three']);
      expect(context.pages['Page One']).to.deep.equal({
        sectionOrder: ['section one', 'section two']
      });
      expect(context.pages['Page Two']).to.deep.equal({
        sectionOrder: ['section three']
      });
      expect(context.pages['Page Three']).to.deep.equal({});
    });

  });





  // --------------------------------------------------
  // sortCategoryBy
  // --------------------------------------------------
  describe('sortCategoryBy', function() {
    var sections;

    beforeEach(function() {
      var sectionOne = {
        name: 'Section One',
        parent: 'Section Three'
      };
      var sectionTwo = {
        name: 'Section Two'
      };
      var sectionThree = {
        name: 'Section Three',
        children: [sectionOne],
        parent: 'Section Four'
      };
      var sectionFour = {
        name: 'Section Four',
        children: [sectionThree]
      };

      sections = [sectionTwo, sectionFour];
    });

    it('should sort the root sections by sectionOrder', function() {
      utils.sortCategoryBy(sections, ['section four', 'section two']);

      expect(sections[0].name).to.equal('Section Four');
      expect(sections[1].name).to.equal('Section Two');
    });

    it('should sort any unlisted sections to the end of the list', function() {
      sections.unshift({name: 'Section Five'});

      utils.sortCategoryBy(sections, ['section four', 'section two']);

      expect(sections[0].name).to.equal('Section Four');
      expect(sections[1].name).to.equal('Section Two');
      expect(sections[2].name).to.equal('Section Five');
    });

  });





  // --------------------------------------------------
  // readFiles
  // --------------------------------------------------
  describe('readFiles', function() {

    it('should call the callback function for each file read', function(done) {
      var files = ['fileOne.css', 'fileTwo.css'];
      var filesRead = [];

      utils.readFiles(files, function(data, file) {
        filesRead.push(file);
      }).then(
        function() {
          expect(filesRead).to.deep.equal(files);
          done();
        })
      .catch(function(err) {
        throw err;
      });
    });

    it('should allow single file names', function(done) {
      var file = 'fileOne.css';
      var fileRead;

      utils.readFiles(file, function(data, file) {
        fileRead = file;
      }).then(
        function() {
          expect(fileRead).to.equal(file);
          done();
        })
      .catch(function(err) {
        throw err;
      });
    });

  });





  // --------------------------------------------------
  // readFileGlobs
  // --------------------------------------------------
  describe('readFileGlobs', function() {

    it('should call the callback function for each file read', function(done) {
      var files = ['template/*.hbs'];
      var filesRead = [];

      utils.readFileGlobs(files, function(data, file) {
        filesRead.push(file);
      }).then(
        function() {
          expect(filesRead.length).to.equal(1);
          expect(filesRead[0]).to.contain('template/template.hbs');
          done();
        })
      .catch(function(err) {
        throw err;
      });
    });

    it('should allow single file patterns', function(done) {
      var file = 'template/*.hbs';
      var fileRead;

      utils.readFileGlobs(file, function(data, file) {
        fileRead = file;
      }).then(
        function() {
          expect(fileRead).to.contain('template/template.hbs');
          done();
        })
      .catch(function(err) {
        throw err;
      });
    });

  });

});