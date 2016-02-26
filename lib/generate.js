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
  if (options.sectionOrder) {
    utils.sortSections(context.sections, options);
  }

  if (typeof options.preprocess !== 'undefined' &&
      typeof options.preprocess !== 'function') {
    throw new SyntaxError('options.preprocess must be a function');
  }

  // if no preprocess function then resolve promise
  options.preprocess = (options.preprocess ?
    options.preprocess.bind({context: context, Handlebars: Handlebars}) :
    function(resolve) { resolve(); });

  new Promise(options.preprocess).then(
    function success() {
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
    }, function failure(err) {
      console.error(err.stack);
    })
  .catch(function(err) {
    console.error(err.stack);
  });
}

module.exports = generate;