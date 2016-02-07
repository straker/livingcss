/*jshint -W030 */

var expect = require('chai').expect;
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var fsStub = {
  writeFile: function(file, data, options, callback) { callback(null); },
  readFile: function(data, options, callback) { callback(null, '')}
};
var mkdirpStub = function(path, callback) { callback(null); };
var HandlebarsStub = {
  compile: function() { return function() {}; }
};

var generate = proxyquire('../lib/generate', {
  fs: fsStub,
  mkdirp: mkdirpStub,
  handlebars: HandlebarsStub
});

describe('generate', function() {
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

    sections = [sectionOne, sectionTwo, sectionThree, sectionFour];
  });

  it('should call the preprocess function', function() {
    var preprocess = sinon.spy();

    generate(null, {sections: sections}, {preprocess: preprocess});

    expect(preprocess.called).to.be.true;
  });

  it('should call the postprocess function', function() {
    var postprocess = sinon.spy();

    generate(null, {sections: sections}, {postprocess: postprocess});

    expect(postprocess.called).to.be.true;
  });

  it('should create a context of only the root sections', function() {
    generate(null, {sections: sections}, {preprocess: function(context) {
      expect(context.sections.length).to.equal(2);
    }});
  });

  it('should sort the root sections by sectionOrder', function() {
    generate(null, {sections: sections}, {sectionOrder: ['section four', 'section two'], preprocess: function(context) {
      expect(context.sections[0].name).to.equal('Section Four');
      expect(context.sections[1].name).to.equal('Section Two');
    }});
  });

  it('should sort any unlisted sections to the end of the list', function() {
    sections.unshift({name: 'Section Five'});

    generate(null, {sections: sections}, {sectionOrder: ['section four', 'section two'], preprocess: function(context) {
      expect(context.sections[0].name).to.equal('Section Four');
      expect(context.sections[1].name).to.equal('Section Two');
      expect(context.sections[2].name).to.equal('Section Five');
    }});
  });

});