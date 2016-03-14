/*jshint -W030 */

var expect = require('chai').expect;
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var utils = require('../lib/utils');

// stubs
var minifyCalled = 0;
var fsStub = {
  writeFile: function(file, data, options, callback) { callback(null); },
};
var mkdirpStub = function(path, callback) { callback(null); };
var HandlebarsStub = {
  compile: function() { return function() { return ''; }; }
};
var htmlMinifierStub = {
  minify: function(file) {
    minifyCalled++;
    return file;
  }
};

var generate = proxyquire('../lib/generate', {
  fs: fsStub,
  mkdirp: mkdirpStub,
  handlebars: HandlebarsStub,
  'html-minifier': htmlMinifierStub
});

describe('generate', function() {

  before(function() {
    sinon.stub(utils, 'readFileGlobs', function() {
      return Promise.resolve();
    });
  });

  after(function() {
    utils.readFileGlobs.restore();
  });



  beforeEach(function() {
    sinon.spy(HandlebarsStub, 'compile');
  });

  afterEach(function() {
    HandlebarsStub.compile.restore();
  });





  it('should remove any non-root sections from the sections list', function() {
    var sections = [{name: 'one'}, {name: 'two', parent: 'one'}, {name: 'three', parent: 'two'}];

    generate(null, '', {sections: sections});

    expect(sections.length).to.equal(1);
    expect(sections[0].name).to.equal('one');
  });

  it('should call utils.sortCategoryBy if context.sectionOrder is set', function() {
    sinon.spy(utils, 'sortCategoryBy');

    generate(null, '', {sections: [], sectionOrder: []}, {});

    expect(utils.sortCategoryBy.called).to.be.true;
    utils.sortCategoryBy.restore();
  });

  it('should call Handlebars if no preprocess function is defined', function(done) {
    generate(null, '', {sections: []}).then(function() {
      expect(HandlebarsStub.compile.called).to.be.true;
      done();
    });
  });

  it('should throw an error if preproces is not a function', function() {
    var fn = function() {
      generate(null, '', {sections: {}}, {preprocess: false});
    };

    expect(fn).to.throw(SyntaxError);

  });

  it('should call the preprocess function', function(done) {
    var preprocess = sinon.spy();

    generate(null, '', {sections: []}, {preprocess: preprocess}).then(function() {
      expect(preprocess.called).to.be.true;
      done();
    });
  });

  it('should call Handlebars when preprocess returns null', function(done) {
    var preprocess = function() {};

    generate(null, '', {sections: []}, {preprocess: preprocess}).then(function() {
      expect(HandlebarsStub.compile.called).to.be.true;
      done();
    });
  });

  it('should call Handlebars when preprocess returns true', function(done) {
    var preprocess = function() { return true; };

    generate(null, '', {sections: []}, {preprocess: preprocess}).then(function() {
      expect(HandlebarsStub.compile.called).to.be.true;
      done();
    });
  });

  it('should call Handlebars when preprocess returns a resolved Promise', function(done) {
    var preprocess = function() { return Promise.resolve(); };

    generate(null, '', {sections: []}, {preprocess: preprocess}).then(function() {
      expect(HandlebarsStub.compile.called).to.be.true;
      done();
    });
  });

  it('should not call Handlebars when preprocess returns false', function(done) {
    var preprocess = function() { return false; };

    generate(null, '', {sections: []}, {preprocess: preprocess}).then(function() {
      expect(HandlebarsStub.compile.called).to.be.false;
      done();
    });
  });

  it('should not call Handlebars when preprocess returns a rejected Promise', function(done) {
    var preprocess = function() { return Promise.reject(); };

    generate(null, '', {sections: []}, {preprocess: preprocess}).then(function() {
      expect(HandlebarsStub.compile.called).to.be.false;
      done();
    });
  });

  it('should call html-minifier if options.minify is true', function(done) {
    // for some reason trying to use sinon.spy doesn't work
    minifyCalled = 0;

    generate(null, '', {sections: []}, {minify: true}).then(function() {
      expect(minifyCalled).to.equal(1);
      done();
    });
  });

});