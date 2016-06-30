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
 * @param {string} template - Handlebars template.
 * @param {object} context - Context to pass to handlebars.
 * @param {string} context.page - Name of the current page.
 * @param {object[]} context.pages - List of pages.
 * @param {object[]} context.sections - List of sections for the page.
 * @param {object[]} context.sections - List of all sections.
 * @param {string[]} context.stylesheets - List of stylesheets to load in the style guide.
 * @param {string[]} context.scripts - List of scripts to load in the style guide.
 * @param {object[]} context.sortOrder - List of pages and their sections in the order they should be sorted.
 * @param {object} [options={}] - Configuration options.
 */
function generate(dest, template, context, options) {
  options = options || {};

  // find all root sections (sections with no parent) by removing all number
  // indices but keeping the named indices
  for (var i = 0; i < context.sections.length; ) {
    if (context.sections[i].parent) {
      context.sections.splice(i, 1);
    }
    else {
      i++;
    }
  }

  // sort root sections by section order
  if (context.sectionOrder) {
    utils.sortCategoryBy(context.sections, context.sectionOrder);
  }

  if (typeof options.preprocess !== 'undefined' &&
      typeof options.preprocess !== 'function') {
    throw new SyntaxError('options.preprocess must be a function');
  }

  // if no preprocess function then resolve a promise
  var preprocess = (options.preprocess ?
    options.preprocess(context, template, Handlebars) :
    Promise.resolve());

  // if the user returned anything but false we'll resolve a promise
  if (!(preprocess instanceof Promise)) {
    preprocess = (preprocess !== false ? Promise.resolve() : Promise.reject());
  }

  return preprocess
    .then(function() {
      // inline all stylesheets for polymer shared styles to work
      // @see https://www.polymer-project.org/1.0/docs/devguide/styling#style-modules
      return utils.readFiles(context.stylesheets, function(data, file) {
        context.parsedStylesheets = context.parsedStylesheets || [];
        context.parsedStylesheets.push(data);
      });
    })
    .then(function success() {
      var html = Handlebars.compile(template)(context);

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
    })
    .catch(function(err) {
      if (err) {
        console.error(err.stack);
      }
    });
}

module.exports = generate;