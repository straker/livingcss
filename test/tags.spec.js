/*jshint -W030 */

var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');
var parseComments = require('../lib/parseComments');
var tags = require('../lib/tags');
var normalizeNewline = require('normalize-newline');

describe('tags', function() {

  // --------------------------------------------------
  // @section
  // --------------------------------------------------
  describe('@section', function() {

    it('should add the block to the sections list', function(done) {
      var file = path.join(__dirname, 'data/section.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages});

        expect(sections.length).to.equal(1);

        done();
      });
    });

    it('should use the tag description as the name and the block description as the description', function(done) {
      var file = path.join(__dirname, 'data/section.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages});

        expect(sections[0].name).to.equal('Buttons');
        expect(sections[0].description).to.equal('<p>Description of buttons and their uses.</p>');
        expect(sections[0].id).to.equal('buttons');

        done();
      });
    });

    it('should use the first line of the block description as the name if there is no tag description', function(done) {
      var file = path.join(__dirname, 'data/section-name-in-description.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages});

        expect(sections[0].name).to.equal('Buttons');
        expect(sections[0].description).to.equal('<p>Description of buttons and their uses.</p>');
        expect(sections[0].id).to.equal('buttons');

        done();
      });
    });

    it('should throw an error if the section has no name', function(done) {
      var file = path.join(__dirname, 'data/section-no-name.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        expect(function() {
          parseComments(data, file, tags, {sections: sections, pages: pages});
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
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages});

        expect(sections.length).to.equal(2);
        expect(sections[0].children).to.exist;
        expect(sections[0].children.length).to.equal(1);

        done();
      });
    });

    it('should allow multiple tags to be defined', function(done) {
      var file = path.join(__dirname, 'data/sectionof-multiple-tags.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages});

        expect(sections['Foo.Faz']).to.exist;
        expect(sections['Bar.Faz']).to.exist;
        expect(sections['Baz.Faz']).to.exist;

        expect(sections['Foo.Faz']).to.equal(sections['Baz.Faz']);
        expect(sections['Bar.Faz']).to.equal(sections['Baz.Faz']);

        done();
      });
    });

    it('should set the depth based on the number of parents', function(done) {
      var file = path.join(__dirname, 'data/sectionof-depth.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages});

        expect(sections.One.depth).to.equal(1);
        expect(sections['One.Two'].depth).to.equal(2);
        expect(sections['One.Two.Three'].depth).to.equal(3);
        expect(sections['One.Two.Three.Four'].depth).to.equal(4);
        expect(sections['One.Two.Three.Four.Five'].depth).to.equal(5);
        expect(sections['One.Two.Three.Four.Five.Six'].depth).to.equal(6);

        done();
      });
    });

    it('should cap the depth', function(done) {
      var file = path.join(__dirname, 'data/sectionof-max-depth.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages});

        expect(sections['One.Two.Three.Four.Five.Six.Seven'].depth).to.equal(6);

        done();
      });
    });

    it('should throw an error if it doesn\'t reference a section', function(done) {
      var file = path.join(__dirname, 'data/sectionof-no-section.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        expect(function() {
          parseComments(data, file, tags, {sections: sections, pages: pages});
        }).to.throw(SyntaxError);

        done();
      });
    });

    it('should allow you to reference a section that will be defined later', function(done) {
      var file = path.join(__dirname, 'data/sectionof-forward-reference.css');
      var file2 = path.join(__dirname, 'data/sectionof-forward-reference-section.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        fs.readFile(file2, 'utf8', function(error, data2) {
          if (err || error) {
            throw err || error;
          }

          parseComments(data, file, tags, {sections: sections, pages: pages});
          parseComments(data2, file2, tags, {sections: sections, pages: pages});

          expect(sections.buttons.children).to.exist;
          expect(sections.buttons.children.length).to.equal(1);
          expect(sections.buttons.children[0].name).to.equal('Awesome Button');

          done();
        });
      });
    });

    it('should throw an error if a section has already been declared inside a parent', function(done) {
      var file = path.join(__dirname, 'data/sectionof-already-defined-section.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        expect(function() {
          parseComments(data, file, tags, {sections: sections, pages: pages});
        }).to.throw(SyntaxError);

        done();
      });
    });

  });





  // --------------------------------------------------
  // @page
  // --------------------------------------------------
  describe('@page', function() {

    it('should add the block to the given page', function(done) {
      var file = path.join(__dirname, 'data/page.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages}, function(block) {

          expect(block.page).to.exist;
          expect(block.page).to.equal('foobar');
          expect(pages.length).to.equal(1);
          expect(pages[0]).to.deep.equal({
            name: 'foobar',
            id: 'foobar',
            sections: [block]
          });
        });

        done();
      });

    });

    it('should allow multiple tags to be defined', function(done) {
      var file = path.join(__dirname, 'data/page-multiple-tags.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages}, function(block) {

          expect(pages.length).to.equal(2);
          expect(pages[0]).to.deep.equal({
            name: 'foo',
            id: 'foo',
            sections: [block]
          });
          expect(pages[1]).to.deep.equal({
            name: 'bar',
            id: 'bar',
            sections: [block]
          });
        });

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
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages}, function(block) {
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
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages}, function(block) {
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
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages}, function(block) {
          expect(block.example).to.exist;
          expect( normalizeNewline(block.example.description) ).to.equal('/**\n * @example example-with-file.css\n */');
        });

        done();
      });
    });

    it('should throw and error if the file path does not exist', function(done) {
      var file = path.join(__dirname, 'data/example-with-nonexistent-file.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        expect(function() {
          parseComments(data, file, tags, {sections: sections, pages: pages});
        }).to.throw(ReferenceError);

        done();
      });
    });

  });

  // --------------------------------------------------
  // @hbs-example
  // --------------------------------------------------
  describe('@hbs-example', function() {

    //testing the accompanying hbs_data tag first.


    it('hbs_data should set convert piped string into array', function(done) {
      var file = path.join(__dirname, 'data/hbs-piped-data-example.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages}, function(block) {
          expect(block.hbs_data).to.exist;
          expect(block.hbs_data).to.deep.equal(['1','2','3']);
        });

        done();
      });
    });

    it('hbs_data should create array if there are two tags', function(done) {
      var file = path.join(__dirname, 'data/hbs-double-data-example.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages}, function(block) {
          expect(block.hbs_data).to.exist;
          expect(block.hbs_data).to.deep.equal(['1','2']);
        });

        done();
      });
    });


    it('hbs_data should create nested array', function(done) {
      var file = path.join(__dirname, 'data/hbs-nested-array-data-example.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages}, function(block) {
          expect(block.hbs_data).to.exist;
          expect(block.hbs_data).to.deep.equal([ ["key","value"],["key","value","another value"] ]);
        });

        done();
      });
    });

    //testing the rendering output

    it('should return <h> tags', function(done) {
      var file = path.join(__dirname, 'data/hbs-piped-data-example.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages}, function(block) {
          expect(block.example.description).to.exist;
          expect(normalizeNewline(block.example.description)).to.equal('<h1>Heading H1 </h1>\n<h2>Heading H2 </h2>\n<h3>Heading H3 </h3>\n');
        });

        done();
      });
    });

    it('should handle nested arrays', function(done) {
      var file = path.join(__dirname, 'data/hbs-nested-array-data-example.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages}, function(block) {
          expect(block.example.description).to.exist;
          expect(normalizeNewline(block.example.description)).to.equal('<ul>\n<li class="key">\n   value\n</li>\n<li class="key">\n   value\n     is just another value\n</li>\n</ul>');
        });

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
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages}, function(block) {
          expect(block.example.description).to.equal('<div>foo</div>');
          expect(block.example.type).to.equal('markup');
          expect(block.code.description).to.equal("console.log('hello');");
          expect(block.code.type).to.equal('javascript');
        });

        done();
      });
    });

    it('should allow the use of the @ symbol', function(done) {
      var file = path.join(__dirname, 'data/code-at-symbol.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages}, function(block) {
          expect( normalizeNewline(block.code.description) ).to.equal('.example {\n  @extend %placeholder-selector;\n}');
        });

        done();
      });
    });

  });





  // --------------------------------------------------
  // @hideCode
  // --------------------------------------------------
  describe('@hideCode', function() {

    it('should remove the code property', function(done) {
      var file = path.join(__dirname, 'data/hideCode.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages}, function(block) {
          expect(block.code).to.not.exist;
        });

        done();
      });
    });

    it('should not set the code property if @hideCode is defined before @example', function(done) {
      var file = path.join(__dirname, 'data/hideCode-before-example.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages}, function(block) {
          expect(block.code).to.not.exist;
        });

        done();
      });
    });

  });





  // --------------------------------------------------
  // @doc
  // --------------------------------------------------
  describe('@doc', function() {

    it('should make the name of the section the first heading from the file', function(done) {
      var file = path.join(__dirname, 'data/doc.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages});

        expect( sections[0].name.trim() ).to.equal('Doc Example');

        done();
      });
    });

    it('should not override the section name if one is already defined', function(done) {
      var file = path.join(__dirname, 'data/doc-with-section-name.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages});

        expect(sections[0].name).to.equal('Buttons');

        done();
      });
    });

    it('should add anything that isn\'t @example or @code to the description', function(done) {
      var file = path.join(__dirname, 'data/doc.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages});

        expect( normalizeNewline(sections[0].description).trim() ).to.equal('<p>Description of the section.</p>\n<h2 id="secondary-heading">Secondary Heading</h2>\n<h1 id="l-heading">L Heading</h1>\n<ul>\n<li>list item 1</li>\n<li>list item 2</li>\n</ul>\n<pre><code>Code in the description\n</code></pre>');

        done();
      });
    });

    it('should allow @example', function(done) {
      var file = path.join(__dirname, 'data/doc.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages});

        expect(sections[0].example).to.exist;
        expect(sections[0].example.description).to.equal('<div>foobar</div>');

        done();
      });
    });

    it('should allow @code', function(done) {
      var file = path.join(__dirname, 'data/doc.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        parseComments(data, file, tags, {sections: sections, pages: pages});

        expect(sections[0].code).to.exist;
        expect(sections[0].code.description).to.equal('<div class="faz">foobar</div>');

        done();
      });
    });

    it('should throw and error if the file path does not exist', function(done) {
      var file = path.join(__dirname, 'data/doc-with-nonexistent-file.css');
      var sections = [];
      var pages = [];

      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          throw err;
        }

        expect(function() {
          parseComments(data, file, tags, {sections: sections, pages: pages});
        }).to.throw(ReferenceError);

        done();
      });
    });

  });

});
