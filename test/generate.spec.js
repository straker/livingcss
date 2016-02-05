/*jshint -W030 */

var expect = require('chai').expect;
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var fsStub = {
  writeFile: function() {}
};
var mkdirpStub = function(path, cb) { cb(); };

var generate = proxyquire('../lib/generate', {'fs': fsStub, 'mkdirp': mkdirpStub});

describe('generate', function() {
  var sections;

  beforeEach(function() {
    delete fsStub.readFile;

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
    fsStub.readFile = function() {};

    var preprocess = sinon.spy();

    generate('', sections, '', {preprocess: preprocess});

    expect(preprocess.called).to.be.true;
  });

  it('should create a context of only the root sections', function() {
    fsStub.readFile = function() {};

    generate('', sections, '', {preprocess: function(context) {
      expect(context.sections.length).to.equal(2);
    }});
  });

  it('should sort the root sections by sectionOrder', function() {
    fsStub.readFile = function() {};

    generate('', sections, '', {sectionOrder: ['section four', 'section two'], preprocess: function(context) {
      expect(context.sections[0].name).to.equal('Section Four');
      expect(context.sections[1].name).to.equal('Section Two');
    }});
  });

  it('should sort any unlisted sections to the end of the list', function() {
    fsStub.readFile = function() {};

    sections.unshift({name: 'Section Five'});

    generate('', sections, '', {sectionOrder: ['section four', 'section two'], preprocess: function(context) {
      expect(context.sections[0].name).to.equal('Section Four');
      expect(context.sections[1].name).to.equal('Section Two');
      expect(context.sections[2].name).to.equal('Section Five');
    }});
  });

});