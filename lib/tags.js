var fs = require('fs');
var path = require('path');
var marked = require('marked');
var utils = require('./utils');

var validFileRegex = /\.[\w]+$/;
var firstLineRegex = /^[\n\r]?([^\n\r]+)/;
var trailingNewline = /[\n\r]+$/;

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

    if (!this.tag.description && !this.comment.description) {
      throw new SyntaxError('unnamed section (' + this.file + ':' +
        (this.tag.line+1) + ')');
    }

    // @section did not define the name so use the first line of the comment
    // description as the section name and use the rest as the section description
    if (!this.tag.description) {
      name = this.comment.description.match(firstLineRegex)[1];
      description = this.comment.description.substr(name.length + 1);
    }

    // @section defined the name so use the comment description as the section
    // description
    else {
      name = this.tag.description;
      description = this.comment.description;
    }

    this.block.name = name;
    this.block.description = marked(description).replace(trailingNewline, '');
    this.block.id = utils.getId(name);
    this.block.depth = 1;  // start sections as H1 until sectionof is encountered

    // we're going to cheat and make an array have object like indices so we
    // have quick access to sections by their name and still have an ordered list
    // that we can use in the template
    this.sections.push(this.block);

    // look to see if this section defines a sectionof so we can create a named
    // hierarchy. Unfortunately this means we have to loop over the tags twice
    var sectionofTag;
    this.comment.tags.forEach(function(tag) {
      if (tag.tag === 'sectionof') {
        sectionofTag = tag;
        name = tag.description + '.' + name;
      }
    });

    if (this.sections[name]) {
      throw new SyntaxError('section \'' + this.block.name +
        '\' has already been declared within the section \'' +
        sectionofTag.description + '\' (' + this.file + ':' +
        (sectionofTag.line+1) + ')');
    }

    this.sections[name] = this.block;
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

    if (section) {
      this.block.depth = this.tag.description.split('.').length + 1;

      // cap heading levels at 6
      if (this.block.depth > 6) {
        this.block.depth = 6;
      }

      var id = utils.getId(this.tag.description.replace('.', ' '));
      this.block.id = id + '-' + this.block.id;
      this.block.parent = this.tag.description;

      section.children = section.children || [];
      section.children.push(this.block);

      return;
    }

    throw new ReferenceError('section \'' + this.tag.description +
      '\' is not defined (' + this.file + ':' + (this.tag.line+1) + ')');
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
    this.pages[this.tag.description] = this.pages[this.tag.description] || [];
    this.pages[this.tag.description].push(this.block);
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
      this.block.code = this.block.example;
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
  }
};
tags.code = tags.example;  // @code and @example generate the same structure

module.exports = tags;