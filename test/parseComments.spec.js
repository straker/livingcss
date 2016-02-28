/*jshint -W030 */

var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');
var parseComments = require('../lib/parseComments');
var tags = require('../lib/tags');

describe('parseComments', function() {

  it('should always take the last parameter as the callback', function(done) {
    var file = path.join(__dirname, 'data/simple-tag.css');

    fs.readFile(file, 'utf8', function(err, data) {
      if (err) {
        throw err;
      }

      // all parameters passed
      parseComments(data, file, {}, [], function(block) {
        expect(block.tagName).to.equal('tagValue');
      });

      // tags not passed
      parseComments(data, file, [], function(block) {
        expect(block.tagName).to.equal('tagValue');
      });

      // section not passed
      parseComments(data, file, {}, function(block) {
        expect(block.tagName).to.equal('tagValue');
      });

      // tags and section not passed
      parseComments(data, file, function(block) {
        expect(block.tagName).to.equal('tagValue');
      });

      done();
    });
  });

  it('should add an undefined tag as a property to the block', function(done) {
    var file = path.join(__dirname, 'data/simple-tag.css');

    fs.readFile(file, 'utf8', function(err, data) {
      if (err) {
        throw err;
      }

      parseComments(data, file, function(block) {
        expect(block.tagName).to.equal('tagValue');
      });

      done();
    });
  });

  it('should execute a defined tags function', function(done) {
    var file = path.join(__dirname, 'data/simple-tag.css');
    var myTags = {
      tagName: function() {
        this.block.foo = 'bar';
      }
    };

    fs.readFile(file, 'utf8', function(err, data) {
      if (err) {
        throw err;
      }

      parseComments(data, file, myTags, function(block) {
        expect(block.foo).to.equal('bar');
      });

      done();
    });
  });

  it('should set an undefined tags value as true if it does not have a description', function(done) {
    var file = path.join(__dirname, 'data/no-description.css');

    fs.readFile(file, 'utf8', function(err, data) {
      if (err) {
        throw err;
      }

      parseComments(data, file, function(block) {
        expect(block.hideCode).to.equal(true);
      });

      done();
    });
  });

  it('should save an undefined tag as an object if it has a type', function(done) {
    var file = path.join(__dirname, 'data/tag-object.css');

    fs.readFile(file, 'utf8', function(err, data) {
      if (err) {
        throw err;
      }

      parseComments(data, file, function(block) {
        expect(block.color).to.exist;
        expect(block.color.type).to.equal('hex');
        expect(block.color.description).to.equal('#fff');
      });

      done();
    });
  });

  it('should parse a tag name', function(done) {
    var file = path.join(__dirname, 'data/name.css');

    fs.readFile(file, 'utf8', function(err, data) {
      if (err) {
        throw err;
      }

      parseComments(data, file, function(block) {
        expect(block.myTag).to.exist;
        expect(block.myTag.name).to.equal('myName');
        expect(block.myTag.description).to.equal('my description');
      });

      done();
    });
  });

  it('tag objects should only contain properties that have been defined in the tag', function(done) {
    var file = path.join(__dirname, 'data/tag-object.css');

    fs.readFile(file, 'utf8', function(err, data) {
      if (err) {
        throw err;
      }

      parseComments(data, file, function(block) {
         expect(block.color.name).to.not.exist;
      });

      done();
    });
  });

  it('should add multiple same tags into an array', function(done) {
    var file = path.join(__dirname, 'data/multiple-same-tags.css');

    fs.readFile(file, 'utf8', function(err, data) {
      if (err) {
        throw err;
      }

      parseComments(data, file, function(block) {
         expect(Array.isArray(block.state)).to.be.true;
         expect(block.state.length).to.equal(3);
      });

      done();
    });
  });

  it('should only parse a name when followed by a hyphen', function(done) {
    var file = path.join(__dirname, 'data/name-only-with-hyphen.css');
    var result = { state: [
      { description: 'hover state', name: ':hover', type: 'type' },
      { description: 'disabled state', name: ':disabled' },
      '.primary-description',
      '.secondary -description',
      { description: 'description', type: 'type' },
      'description with some text and no name',
      '.party some text which then needs a hyphen - to separate content'
    ]};

    fs.readFile(file, 'utf8', function(err, data) {
      if (err) {
        throw err;
      }

      parseComments(data, file, function(block) {
        expect(block).to.deep.equal(result);
      });

      done();
    });
  });

});