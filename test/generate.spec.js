/*jshint -W030 */

var expect = require('chai').expect;
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var fsStub = {
  writeFile: function(file, data, options, callback) { callback(null); },
  readFile: function(data, options, callback) { callback(null, ''); }
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

  it('should call the preprocess function', function() {
    var preprocess = sinon.spy();

    generate(null, {sections: []}, {preprocess: preprocess});

    expect(preprocess.called).to.be.true;
  });

  it('should not call the postprocess function if the handlebars template was not generated', function() {
    var postprocess = sinon.spy();

    generate(null, {sections: []}, {postprocess: postprocess});

    expect(postprocess.called).to.be.false;
  });

  it('should call the postprocess function if the handlebars template was generated', function() {
    var postprocess = sinon.spy();

    generate(null, {sections: []}, {postprocess: postprocess, handlebars: true});

    expect(postprocess.called).to.be.true;
  });

});