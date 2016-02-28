/*jshint -W030 */

var expect = require('chai').expect;
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var utils = require('../lib/utils');

// stubs
var minifyCalled = 0;
var fsStub = {
  writeFile: function(file, data, options, callback) { callback(null); },
  readFile: function(file, options, callback) { callback(null, ''); }
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

  it('should remove any non-root sections from the sections list', function() {
    var sections = [{name: 'one'}, {name: 'two', parent: 'one'}, {name: 'three', parent: 'two'}];

    generate(null, {sections: sections});

    expect(sections.length).to.equal(1);
    expect(sections[0].name).to.equal('one');
  });

  it('should call utils.sortSections if options.sectionOrder is set', function() {
    sinon.spy(utils, 'sortSections');

    generate(null, {sections: []}, {sectionOrder: []});

    expect(utils.sortSections.called).to.be.true;
    utils.sortSections.restore();
  });

  it('should call Handlebars if no preprocess function is defined', function(done) {
    sinon.spy(HandlebarsStub, 'compile');

    generate(null, {sections: []});

    // wait for the promise logic to resolve on the next process
    setTimeout(function() {
      expect(HandlebarsStub.compile.called).to.be.true;
      HandlebarsStub.compile.restore();
      done();
    }, 0);
  });

  it('should throw an error if preproces is not a function', function() {
    var fn = function() {
      generate(null, {sections: {}}, {preprocess: false});
    };

    expect(fn).to.throw(SyntaxError);

  });

  it('should call the preprocess function', function() {
    var preprocess = sinon.spy();

    generate(null, {sections: []}, {preprocess: preprocess});

    expect(preprocess.called).to.be.true;
  });

  it('should call Handlebars when preprocess returns null', function(done) {
    sinon.spy(HandlebarsStub, 'compile');

    generate(null, {sections: []}, {preprocess: function() {
    }});

    // wait for the promise logic to resolve on the next process
    setTimeout(function() {
      expect(HandlebarsStub.compile.called).to.be.true;
      HandlebarsStub.compile.restore();
      done();
    }, 0);
  });

  it('should call Handlebars when preprocess returns true', function(done) {
    sinon.spy(HandlebarsStub, 'compile');

    generate(null, {sections: []}, {preprocess: function() {
      return true;
    }});

    // wait for the promise logic to resolve on the next process
    setTimeout(function() {
      expect(HandlebarsStub.compile.called).to.be.true;
      HandlebarsStub.compile.restore();
      done();
    }, 0);
  });

  it('should call Handlebars when preprocess returns a resolved Promise', function(done) {
    sinon.spy(HandlebarsStub, 'compile');

    generate(null, {sections: []}, {preprocess: function() {
      return Promise.resolve();
    }});

    // wait for the promise logic to resolve on the next process
    setTimeout(function() {
      expect(HandlebarsStub.compile.called).to.be.true;
      HandlebarsStub.compile.restore();
      done();
    }, 0);
  });

  it('should not call Handlebars when preprocess returns false', function(done) {
    sinon.spy(HandlebarsStub, 'compile');

    generate(null, {sections: []}, {preprocess: function() {
      return false;
    }});

    // wait for the promise logic to resolve on the next process
    setTimeout(function() {
      expect(HandlebarsStub.compile.called).to.be.false;
      HandlebarsStub.compile.restore();
      done();
    }, 0);
  });

  it('should not call Handlebars when preprocess returns a rejected Promise', function(done) {
    sinon.spy(HandlebarsStub, 'compile');

    generate(null, {sections: []}, {preprocess: function() {
      return Promise.reject();
    }});

    // wait for the promise logic to resolve on the next process
    setTimeout(function() {
      expect(HandlebarsStub.compile.called).to.be.false;
      HandlebarsStub.compile.restore();
      done();
    }, 0);
  });

  it('should call html-minifier if options.minify is true', function(done) {
    // for some reason trying to use sinon.spy doesn't work
    minifyCalled = 0;

    generate(null, {sections: []}, {minify: true});

    // wait for the promise logic to resolve on the next process
    setTimeout(function() {
      expect(minifyCalled).to.equal(1);
      done();
    }, 0);
  });

});