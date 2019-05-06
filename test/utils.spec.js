/*jshint -W030 */

var expect = require('chai').expect;
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var normalizeNewline = require('normalize-newline');

// stubs
var fsStub = {
  writeFile: function(file, data, options, callback) { callback(null); },
  readFile: function(file, options, callback) {
    if (file instanceof Error) return callback(file);
    if (file === '__ERROR__') return callback('readFile error');
    callback(null, '');
  }
};
var globStub = function(files, callback) {
  if (files instanceof Error) return callback(files);
  files = (!Array.isArray(files) ? [files] : files);
  callback(null, files);
}

var utils = proxyquire('../lib/utils', {
  fs: fsStub,
  glob: globStub
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

    it('should call the callback in file order', function(done) {
      var files = [];
      for (var i = 1; i <= 100; i++) {
        files.push(i.toString());
      }

      var counter = 1;
      utils.readFiles(files, function(data, file) {
        expect(parseInt(file)).to.equal(counter);
        counter++;
      }).then(
        function() {
          done();
        })
      .catch(function(err) {
        throw err;
      });
    });

    it('should handle error', function(done) {
      var file = new Error('custom cannot read file');

      utils.readFiles(file)
      .then(function() {
        done('readFiles did not throw error');
      })
      .catch(function(err) {
        done();
      });
    });

  });





  // --------------------------------------------------
  // readFileGlobs
  // --------------------------------------------------
  describe('readFileGlobs', function() {

    it('should call the callback function for each file read', function(done) {
      var files = ['template/template.hbs'];
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
      var file = 'template/template.hbs';
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

    it('should call the callback in file order for single pattern', function(done) {
      var files = [];
      for (var i = 1; i <= 100; i++) {
        files.push(i.toString());
      }

      var counter = 1;
      utils.readFileGlobs(files, function(data, file) {
        expect(parseInt(file)).to.equal(counter);
        counter++;
      }).then(
        function() {
          done();
        })
      .catch(function(err) {
        throw err;
      });
    });

    it('should call the callback in file order for an array of pattens', function(done) {
      var files = [];
      for (var j = 0; j < 10; j++) {
        var fileList = [];
          for (var i = 1; i <= 10; i++) {
          fileList.push((j * 10 + i).toString());
        }
        files.push(fileList);
      }

      var counter = 1;
      utils.readFileGlobs(files, function(data, file) {
        expect(parseInt(file)).to.equal(counter);
        counter++;
      }).then(
        function() {
          done();
        })
      .catch(function(err) {
        throw err;
      });
    });

    it('should handle glob error', function(done) {
      var files = new Error('custom: glob error');

      utils.readFileGlobs(files)
      .then(function() {
        done('readFileGlobs did not throw error');
      })
      .catch(function(err) {
        expect(err.message).to.equal('custom: glob error');
        done();
      });
    });

    it('should handle read file error', function(done) {
      var files = '__ERROR__';

      utils.readFileGlobs(files)
      .then(function() {
        done('readFileGlobs did not throw error');
      })
      .catch(function(err) {
        expect(err).to.equal('readFile error');
        done();
      });
    });

  });


  // --------------------------------------------------
  // fixSVGIssue
  // --------------------------------------------------
  describe('fixSVGIssue', function() {
    it('should replace single quotes in svg url expressions with %27', function() {
      var testString = 'url("data:image\/svg+xml;\'")';
      expect(utils.fixSVGIssue(testString)).to.equal('url("data:image\/svg+xml;%27")');

      // Case for a closing paren inside url
      testString = 'url("data:image/svg+xml;<svg xmlns=\'blah\'><g transform=\'translate(-1, -1)\'>")';
      expect(utils.fixSVGIssue(testString)).to.equal(
        'url("data:image/svg+xml;<svg xmlns=%27blah%27><g transform=%27translate(-1, -1)%27>")'
      );
    });

    it('should only replace single quotes in svg url expressions', function() {
      var testString = 'url("data:image\/svg+xml;\'")\nurl("data:image\/svg+xml;\'")\n\'Arial\'';
      expect( normalizeNewline( utils.fixSVGIssue(testString) ) ).to.equal(
        'url("data:image\/svg+xml;%27")\nurl("data:image\/svg+xml;%27")\n\'Arial\''
      );

      testString = 'url("data:image/svg+xml;\'...\'"), url(\'non-svg-url\')';
      expect(utils.fixSVGIssue(testString)).to.equal(
        'url("data:image/svg+xml;%27...%27"), url(\'non-svg-url\')'
      );
    });

    it('should leave regular urls alone', function() {
      var testString = "url('normaladdress.gif')";
      expect(utils.fixSVGIssue(testString)).to.equal(testString);
    });
  });
});