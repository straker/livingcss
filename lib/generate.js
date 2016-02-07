var fs = require('fs');
var Handlebars = require('handlebars');
var minify = require('html-minifier').minify;
var mkdirp = require("mkdirp");
var path = require('path');

/**
 * Generate an HTML page.
 *
 * @param {string} dest - Path of the file for the generated HTML.
 * @param {object} context - Context to pass to handlebars.
 * @param {object[]} context.sections - List of sections.
 * @param {string[]} context.stylesheets - List of stylesheets used to generate the style guide.
 * @param {object} options - Configuration options.
 */
function generate(dest, context, options) {
  // find all root sections (sections with no parent)
  var rootSections = context.sections.filter(function(section) {
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

  context.allSections = context.sections;
  context.sections = rootSections;

  // allow user to modify the context before being passed to handlebars
  if (typeof options.preprocess === 'function') {
    options.preprocess(context, Handlebars, options);
  }

  fs.readFile(options.template, 'utf8', function(err, data) {
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

      fs.writeFile(dest, html, 'utf8', function(err) {
        if (err) {
          throw err;
        }

        // allow user to modify anything after the file has been written
        if (typeof options.postprocess === 'function') {
          options.postprocess(context, Handlebars, options);
        }
      });
    });
  });
}

module.exports = generate;