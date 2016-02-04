var marked = require('marked');
var utils = require('./utils');

var firstLineRe = /^[^\n\r]+/;

var tags = {

  /**
   * Add a new section to the style guide.
   *
   * The @section tag can define the section name or the first line of the description will be
   * used as the section name.
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
  section: function (params) {
    var name, description;

    if (!params.tag.description && !params.comment.description) {
      throw new SyntaxError('unnamed section (' + params.file + ':' + (params.tag.line+1) + ')');
    }

    // @section did not define the name so use the first line of the block description
    // as the section name and use the rest as the section description
    if (!params.tag.description) {
      name = params.comment.description.match(firstLineRe)[0];
      description = params.comment.description.substr(params.comment.name.length).replace(/^[\n\r]+/, '');
    }
    // @section defined the name so use the comment description as the section description
    else {
      name = params.tag.description;
      description = params.comment.description;
    }

    params.block.name = name;
    params.block.description = marked(description);
    params.block.id = utils.getId(name);

    params.sections.push(params.block);
  },

  /**
   * Identify a section as a child of another section.
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
  sectionof: function(params) {
    for (var i = 0, section; section = params.sections[i]; i++) {
      if (section.name === params.tag.description) {
        params.block.parent = section.name;

        section.children = section.children || [];
        section.children.push(params.block);

        return;
      }
    }

    throw new ReferenceError('section ' + params.tag.description + ' referenced before being defined (' + params.file + ':' + (params.tag.line+1) + ')');
  }
};

module.exports = tags;