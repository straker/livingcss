var fs = require('fs');
var Handlebars = require('handlebars');
var minify = require('html-minifier').minify;
var mkdirp = require("mkdirp");
var path = require('path');
var utils = require('./utils');

/**
 * Generate an HTML page.
 *
 * @param {string} dest - Path of the file for the generated HTML.
 * @param {object} context - Context to pass to handlebars.
 * @param {object[]} context.sections - List of sections.
 * @param {string[]} context.stylesheets - List of stylesheets to load in the style guide
 * @param {string[]} context.scripts - List of scripts to load in the style guide
 * @param {object} options - Configuration options.
 */
function generate(dest, context, options) {
  // find all root sections (sections with no parent)
  var rootSections = context.sections.filter(function(section) {
    return !section.parent;
  });

  // sort root sections by section order
  if (options.sectionOrder) {
    utils.sortSections(rootSections, options);
  }

  // give access to the full list of sections to the user
  context.allSections = context.sections;
  context.sections = rootSections;

  // allow user to modify the context before being passed to handlebars
  if (typeof options.preprocess === 'function') {
    options.preprocess(context, Handlebars, options);
  }

  if (options.handlebars) {
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
        });

      });

    });
  }
}

module.exports = generate;