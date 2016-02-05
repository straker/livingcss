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
      tagName: function(params) {
        params.block.foo = 'bar';
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

  describe('tag @section', function() {

    it('should add the block to the sections list', function(done) {
      var file = path.join(__dirname, 'data/section.css');
      var sections = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, sections);

        expect(sections.length).to.equal(1);

        done();
      });
    });

    it('should use the tag description as the name and the block description as the description', function(done) {
      var file = path.join(__dirname, 'data/section.css');
      var sections = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, sections);

        expect(sections[0].name).to.equal('Buttons');
        expect(sections[0].description).to.equal('<p>Description of buttons and their uses.</p>\n');
        expect(sections[0].id).to.equal('buttons');

        done();
      });
    });

    it('should use the first line of the block description as the name if there is no tag description', function(done) {
      var file = path.join(__dirname, 'data/section-name-in-description.css');
      var sections = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, sections);

        expect(sections[0].name).to.equal('Buttons');
        expect(sections[0].description).to.equal('<p>Description of buttons and their uses.</p>\n');
        expect(sections[0].id).to.equal('buttons');

        done();
      });
    });

    it('should throw an error if the section has no name', function(done) {
      var file = path.join(__dirname, 'data/section-no-name.css');
      var sections = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        expect(function() {
          parseComments(data, file, tags, sections);
        }).to.throw(SyntaxError);

        done();
      });
    });

    it('should correctly parse a complex comment', function(done) {
      var file = path.join(__dirname, 'data/complex.css');
      var sections = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }


        parseComments(data, file, tags, sections);

        expect(sections[0]).to.deep.equal({
          name: 'Complex Block',
          description: '<p>This is a complex block with multiple tags.</p>\n',
          id: 'complex-block',
          example: '<div>foo<span>bar</span></div>',
          code: '<div>foo</div>',
          customTag: true,
        });

        done();
      });
    });

  });

  describe('tag @sectionof', function() {

    it('should add the block as a child to the parent section', function(done) {
      var file = path.join(__dirname, 'data/sectionof.css');
      var sections = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, sections);

        expect(sections.length).to.equal(2);
        expect(sections[0].children).to.exist;
        expect(sections[0].children.length).to.equal(1);

        done();
      });
    });

    it('should throw an error if it doesn\'t reference a section', function(done) {
      var file = path.join(__dirname, 'data/sectionof-no-section.css');
      var sections = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        expect(function() {
          parseComments(data, file, tags, sections);
        }).to.throw(SyntaxError);

        done();
      });
    });

    it('should throw an error if a section is referenced before being defined', function(done) {
      var file = path.join(__dirname, 'data/sectionof-undefined-section.css');
      var sections = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        expect(function() {
          parseComments(data, file, tags, sections);
        }).to.throw(ReferenceError);

        done();
      });
    });

  });

});