var fs = require('fs');
var path = require('path');
var marked = require('marked');
var utils = require('./utils');
var normalizeNewline = require('normalize-newline');

var validFileRegex = /\.[\w]+$/;
var firstLineRegex = /^[\n\r]?([^\n\r]+)/;
var trailingNewline = /\s+$/;
var atSymbolRegex = /&#64;/g;

var forwardReferenceSections = {};

var tags = {

  /**
   * Add a new section to the style guide.
   *
   * The @section tag can define the section name, otherwise the first line of the
   * description will be used as the section name.
   *
   * @example
      /**
       * My Section
       *
       * A description of the section and how to use it.
       *
       * @section
       *\/

       /**
       * A description of the section and how to use it.
       *
       * @section My Section
       *\/
   */
  section: function () {
    var name, description;

    //added trim() to normalize returns on different OSs
    if (!this.tag.description && !this.comment.description.trim() ) {
      throw new SyntaxError('unnamed section (' + this.file + ':' +
        (this.tag.line+1) + ')');
    }

    // @section did not define the name so use the first line of the comment
    // description as the section name and use the rest as the section description
    if (!this.tag.description) {
      var normDescription = normalizeNewline(this.comment.description);
      name = normDescription.match(firstLineRegex)[1].trim();
      description = normDescription.substr(name.length + 1);
    }

    // @section defined the name so use the comment description as the section
    // description
    else {
      name = this.tag.description.trimRight();
      description = this.comment.description;
    }

    this.block.name = name;
    this.block.description = marked(description).replace(trailingNewline, '');
    this.block.id = utils.getId(name);
    this.block.depth = 1;  // start sections as H1 until sectionof is encountered
    this.block.isSection = true;

    // we're going to cheat and make an array have object like indices so we
    // have quick access to sections by their name and still have an ordered list
    // that we can use in the template
    this.sections.push(this.block);

    // add any children from forward referenced sectionof
    if (forwardReferenceSections[name]) {
      this.block.children = [];

      forwardReferenceSections[name].forEach(function(section) {
        this.block.children.push(section.block);
      }.bind(this));

      delete forwardReferenceSections[name];
    }

    // look to see if this section defines a sectionof so we can create a named
    // hierarchy. Can define multiple sectionof tags on one block. Unfortunately
    // this means we have to loop over the tags twice
    var sectionofTag, sectionofName;
    this.comment.tags.forEach(function(tag) {
      if (tag.tag === 'sectionof') {
        sectionofTag = tag;
        sectionofName = tag.description + '.' + name;

        if (this.sections[sectionofName]) {
          throw new SyntaxError('section \'' + this.block.name +
            '\' has already been declared within the section \'' +
            sectionofTag.description + '\' (' + this.file + ':' +
            (sectionofTag.line+1) + ')');
        }

        this.sections[sectionofName] = this.block;

        // also add the normalized name for case insensitivity
        this.sections[ utils.normalizeName(sectionofName) ] = this.block;
      }
    }.bind(this));

    if (!sectionofTag) {
      this.sections[name] = this.block;

      // also add the normalized name for case insensitivity
      this.sections[ utils.normalizeName(name) ] = this.block;
    }
  },

  /**
   * Add a section as a child of another section.
   *
   * @example
      /**
       * A description of the parent section.
       *
       * @section Parent Section
       *\/

      /**
       * A description of the child section.
       *
       * @section Child Section
       * @sectionof Parent Section
       *\/
   */
  sectionof: function() {
    if (!this.tag.description) {
      throw new SyntaxError('@sectionof must reference a section (' +
        this.file + ':' + (this.tag.line+1) + ')');
    }

    var section = this.sections[this.tag.description];
    this.block.depth = this.tag.description.split('.').length + 1;

    // cap heading levels at 6
    if (this.block.depth > 6) {
      this.block.depth = 6;
    }

    var id = utils.getId(this.tag.description.replace('.', ' '));
    this.block.id = id + '-' + this.block.id;
    this.block.parent = this.tag.description;

    if (section) {
      section.children = section.children || [];
      section.children.push(this.block);
    }

    // forward referenced section
    else {
      forwardReferenceSections[this.tag.description] = forwardReferenceSections[this.tag.description] || [];
      forwardReferenceSections[this.tag.description].push({
        block: this.block,

        // save error so we have line number, file, and correct location
        error: new ReferenceError('section \'' + this.tag.description +
          '\' is not defined (' + this.file + ':' + (this.tag.line+1) + ')')
      });
    }
  },

  /**
   * Assign the section to a page. Each page will be written to a file. Only the
   * root section needs to specify the page as all children will inherit from it.
   * @example
      /**
       * Section belonging to a page.
       *
       * @section Section Name
       * @page Page Name
       *\/
   */
   page: function() {
    this.block.page = this.tag.description;

    if (this.pages[this.tag.description]) {
      this.pages[this.tag.description].sections.push(this.block);
    }
    else {
      var page = {
        name: this.block.page,
        id: utils.getId(this.block.page),
        sections: [this.block]
      };

      this.pages[this.block.page] = page;

      // also add the normalized name for case insensitivity
      this.pages[ utils.normalizeName(this.block.page) ] = page;

      this.pages.push(page);
    }
   },

  /**
   * Provide an example that will be displayed in the style guide. Can provide a
   * type to change the language for code highlighting. Can also provide a
   * filename to be used as the example.
   * @see http://prismjs.com/#languages-list
   *
   * @example
      /**
       * A simple example.
       *
       * @example
       * <div>foo</div>
       *\/

      /**
       * An example with a language type.
       *
       * @example {javascript}
       * console.log('foo');
       *\/

      /**
       * An example from a file
       *
       * @example
       * path/to/file.html
       *\/
   */
  example: function() {
    var description = this.tag.description.trimRight();

    if (validFileRegex.test(description)) {
      var resolvedPath = path.resolve(path.dirname(this.file), description);

      try {
        description = fs.readFileSync(resolvedPath, 'utf-8');
      } catch (e) {
        throw new ReferenceError('File not found \'' + resolvedPath + '\' (' +
          this.file + ':' + (this.tag.line+1) + ')');
      }
    }

    this.block[this.tag.tag] = {
      description: description,
      type: this.tag.type || 'markup'
    };

    // default code to use the example only if hideCode hasn't been set
    if (this.tag.tag === 'example' && !this.block.code && !this.block.hideCode) {

      // don't make them the same object so you can edit one later in preprocess
      this.block.code = JSON.parse(JSON.stringify(this.block.example));
    }

    // replace html encoded at symbol with the actual @ symbol
    // this allows the use of the @ symbol in code examples without the parser
    // trying to parse it as a tag
    // @code
    // .example {
    //   @extend %placeholder-selector;
    // }
    if (this.block.code) {
      this.block.code.description = this.block.code.description.replace(atSymbolRegex, '@');
    }
  },

  /**
   * Hide the code output of an example.
   *
   * @example
      /**
       * A simple example.
       *
       * @example
       * <div>foo</div>
       * @hideCode
       *\/
   */
  hideCode: function() {
    this.block.hideCode = true;

    if (this.block.code) {
      delete this.block.code;
    }
  },

  /**
   * Use a markdown file as the documentation. The first heading of the .md file
   * will be used as the name of the section if @section does not define one.
   * Because the @section doesn't have a name, the @doc must precede the @section.
   * Only @code and @example can be used inside of the doc file.
   *
   * @example
      /**
       * @section
       * @doc path/to/file.md
       *\/
   */
  doc: function() {
    var file = this.tag.description.trimRight();
    var resolvedPath = path.resolve(path.dirname(this.file), file);
    var lexer = new marked.Lexer();
    var headingSet = false;
    var description = '';
    var result, parsedResult, isCode, isHeading, tag;

    try {
      file = normalizeNewline(fs.readFileSync(resolvedPath, 'utf-8'));
    } catch (e) {
      throw new ReferenceError('File not found \'' + resolvedPath + '\' (' +
        this.file + ':' + (this.tag.line+1) + ')');
    }

    // loop through the file by removing one line at a time and use the marked
    // rules to look for heading and code blocks
    //
    // modified from the marked token parser
    // @see https://github.com/chjj/marked/blob/master/lib/marked.js#L150
    while (file.indexOf('\n') !== -1) {
      isCode = false;
      isHeading = false;

      // code
      if (result = lexer.rules.code.exec(file)) {
        file = file.substring(result[0].length);
        parsedResult = result[0].replace(/^ {4}/gm, '').replace(/\n+$/, '');
        isCode = true;
      }

      // fences (gfm)
      else if (result = lexer.rules.fences.exec(file)) {
        file = file.substring(result[0].length);
        parsedResult = result[3];
        isCode = true;
      }

      // heading
      else if (result = lexer.rules.heading.exec(file)) {
        file = file.substring(result[0].length);
        parsedResult = result[2];
        isHeading = true;
      }

      // lheading
      else if (result = lexer.rules.lheading.exec(file)) {
        file = file.substring(result[0].length);
        parsedResult = result[1];
        isHeading = true;
      }

      // go to next line
      else if (file.indexOf('\n') !== -1) {
        description += file.substring(0, file.indexOf('\n')+1);
        file = file.substring(file.indexOf('\n')+1);
      }

      // handle code being able to create example or code tags
      if (isCode) {
        if (parsedResult.indexOf('@example') === 0) {
          tag = 'example';
        }
        else if (parsedResult.indexOf('@code') === 0) {
          tag = 'code';
        }

        // any code block that is not @example or @code will be added to the
        // description
        else {
          description += result[0];
          continue;
        }

        this.comment.tags.push({
          tag: tag,
          type: (result[2] ? result[2] : ''),
          description: parsedResult.replace('@' + tag, '').trimLeft()
        });
      }

      // handle heading setting the section name
      else if (isHeading) {

        // if section name is already set then just add this heading to the
        // description
        if (headingSet) {
          description += result[0];
        }

        else {
          // look at the @section tag and set its name if it's not defined
          for (var i = 0; (tag = this.comment.tags[i]); i++) {
            if (tag.tag === 'section') {
              if (!tag.description) {
                tag.description = parsedResult;
              }

              // if section name is already set then just add this heading to the
              // description
              else {
                description += result[0];
              }

              break;
            }
          }

          headingSet = true;
        }
      }
    }

    // add last line to description
    description += file;

    this.comment.description += description.trimRight();
  },

  /**
   * Apply a namespace to example code. Multiple namespaces will be applied to the same element.
   * Nesting not supported.
   * @example
   /**
   * @section
   * @namespace foo
   *\/
   */
  namespace: function () {
    this.block.namespace = this.tag.description;
  }
};
tags.code = tags.example;  // @code and @example generate the same structure

module.exports = tags;
module.exports.forwardReferenceSections = forwardReferenceSections;
