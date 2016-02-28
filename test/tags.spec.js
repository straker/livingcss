/*jshint -W030 */

var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');
var parseComments = require('../lib/parseComments');
var tags = require('../lib/tags');

describe('tags', function() {

  // --------------------------------------------------
  // @section
  // --------------------------------------------------
  describe('@section', function() {

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
        expect(sections[0].description).to.equal('<p>Description of buttons and their uses.</p>');
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
        expect(sections[0].description).to.equal('<p>Description of buttons and their uses.</p>');
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

  });





  // --------------------------------------------------
  // @sectionof
  // --------------------------------------------------
  describe('@sectionof', function() {

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

    it('should throw an error if a section has already been declared inside a parent', function(done) {
      var file = path.join(__dirname, 'data/sectionof-already-defined-section.css');
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

  });





  // --------------------------------------------------
  // @example
  // --------------------------------------------------
  describe('@example', function() {

    it('should set default code and language properties', function(done) {
      var file = path.join(__dirname, 'data/example.css');
      var sections = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, sections, function(block) {
          expect(block.code).to.exist;
          expect(block.code.description).to.equal(block.example.description);
          expect(block.code.type).to.equal(block.example.type);
        });

        done();
      });
    });

    it('should not override @code if already defined', function(done) {
      var file = path.join(__dirname, 'data/example-code-before.css');
      var sections = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, sections, function(block) {
          expect(block.example.description).to.equal('<div>bar</div>');
          expect(block.example.type).to.equal('markup');
          expect(block.code.description).to.equal('<div>foo</div>');
          expect(block.code.type).to.equal('markup');
        });

        done();
      });
    });

    it('should allow a filepath', function(done) {
      var file = path.join(__dirname, 'data/example-with-file.css');
      var sections = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, sections, function(block) {
          expect(block.example).to.exist;
          expect(block.example.description).to.equal('/**\n * @example example-with-file.css\n */');
        });

        done();
      });
    });

    it('should throw and error if the file path does not exist', function(done) {
      var file = path.join(__dirname, 'data/example-with-nonexistent-file.css');
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





  // --------------------------------------------------
  // @code
  // --------------------------------------------------
  describe('@code', function() {

    it('should override @example', function(done) {
      var file = path.join(__dirname, 'data/example-code-language.css');
      var sections = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, sections, function(block) {
          expect(block.example.description).to.equal('<div>foo</div>');
          expect(block.example.type).to.equal('markup');
          expect(block.code.description).to.equal("console.log('hello');");
          expect(block.code.type).to.equal('javascript');
        });

        done();
      });
    });

  });





  // --------------------------------------------------
  // @hideCode
  // --------------------------------------------------
  describe('@hideCode', function() {

    it('should not set the code property if @hideCode is defined before @example', function(done) {
      var file = path.join(__dirname, 'data/hideCode-before-example.css');
      var sections = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, sections, function(block) {
          expect(block.code).to.not.exist;
        });

        done();
      });
    });

    it('should remove the code property', function(done) {
      var file = path.join(__dirname, 'data/hideCode-before-example.css');
      var sections = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, sections, function(block) {
          expect(block.code).to.not.exist;
        });

        done();
      });
    });

  });

});