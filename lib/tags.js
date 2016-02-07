var marked = require('marked');
var utils = require('./utils');

var firstLineRe = /^[^\n\r]+/;

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
      throw new SyntaxError('unnamed section (' + this.file + ':' + (this.tag.line+1) + ')');
    }

    // @section did not define the name so use the first line of the comment
    // description as the section name and use the rest as the section description
    if (!this.tag.description) {
      name = this.comment.description.match(firstLineRe)[0];
      description = this.comment.description.substr(name.length).replace(/^[\n\r]+/, '');
    }
    // @section defined the name so use the comment description as the section
    // description
    else {
      name = this.tag.description;
      description = this.comment.description;
    }

    this.block.name = name;
    this.block.description = marked(description);
    this.block.id = utils.getId(name);

    this.sections.push(this.block);
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
      throw new SyntaxError('@sectionof must reference a section (' + this.file + ':' + (this.tag.line+1) + ')');
    }

    for (var i = 0, section; section = this.sections[i]; i++) {
      if (section.name === this.tag.description) {
        this.block.parent = section.name;

        section.children = section.children || [];
        section.children.push(this.block);

        return;
      }
    }

    throw new ReferenceError('section ' + this.tag.description + ' referenced before being defined (' + this.file + ':' + (this.tag.line+1) + ')');
  }
};

module.exports = tags;