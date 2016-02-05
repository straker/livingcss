var fs = require('fs');
var Handlebars = require('handlebars');
var minify = require('html-minifier').minify;
var mkdirp = require("mkdirp");
var path = require('path');

/**
 * Generate an HTML page.
 *
 * @param {string} dest - Path of the file for the generated HTML.
 * @param {object[]} sections - List of sections.
 * @param {string} template - Path to the handlebars template to use for generating the HTML.
 * @param {object} options - Configuration options.
 */
function generate(dest, sections, template, options) {
  // find all root sections (sections with no parent)
  var rootSections = sections.filter(function(section) {
    return !section.parent;
  });

  // sort root sections by section order
  if (options.sectionOrder) {
    rootSections.sort(function(a, b) {
      var aIndex = options.sectionOrder.indexOf(a.name.toLowerCase());
      var bIndex = options.sectionOrder.indexOf(b.name.toLowerCase());

      // default sections not in the section order to the bottom of the stack
      if (aIndex === -1) {
        return 1;
      }
      else if (bIndex === -1) {
        return -1;
      }

      return aIndex - bIndex;
    });
  }

  var context = { sections: rootSections };

  // allow users to modify the context before being passed to handlebars
  if (typeof options.preprocess === 'function') {
    options.preprocess(context, options);
  }

  fs.readFile(template, 'utf8', function(err, data) {
    if (err) {
      throw err;
    }

    var html = Handlebars.compile(data)(context);

    if (options.minify) {
      html = minify(html, {
        collapseWhitespace: true
      });
    }

    // output the file and create any necessary directories
    // @see http://stackoverflow.com/questions/16316330/how-to-write-file-if-parent-folder-dosent-exists
    mkdirp(path.dirname(dest), function(err) {
      if (err) {
        throw err;
      }

      fs.writeFile(dest, html, 'utf8');
    });
  });
}

module.exports = generate;