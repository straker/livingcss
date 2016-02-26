/*jshint -W055 */
var fs = require('fs');
var path = require('path');
var Promise = require("native-promise-only");

var generate = require('./lib/generate');
var parseComments = require('./lib/parseComments');
var tags = require('./lib/tags');
var utils = require('./lib/utils');

/**
 * Parse comments in your CSS to generate a living style guide using Markdown.
 *
 * @param {string|string[]} source=[] - A single file, list of files, or glob file paths to be parsed to generate the style guide.
 * @param {string} dest - Path of the file for the generated HTML.
 * @param {object} [options={}] - Configuration options.
 * @param {string} [options.template="defaultTempalte.hbs"] - Path to the Handlebars template to use for generating the HTML.
 * @param {string[]} [options.sectionOrder=[]] - List of root section names (a section without a parent) in the order they should be sorted. Any root section not listed will be added to the end in the order encountered.
 * @param {object} [options.tags={}] - Object of custom tag names to callback functions that are called when the tag is encountered. The tag, the parsed comment, the block object, the list of sections, and the file are passed as the `this` object to the callback function.
 * @param {boolean} [options.minify=false] - If the generated HTML should be minified.
 * @param {boolean} [options.loadcss=true] - If the style guide should load the css files that were used to generate it. The style guide will not move the styles to the output directory but will merely link to the styles in their current directory (so relative paths from the styles still work).
 * @param {function} [options.preprocess] - Function that will be executed right before Handlebars is called with the context object. The function will be passed the context object, the Handlebars object, and the options passed to `livingcss` as parameters. Use this function to modify the context object or register Handlebars helpers or decorators.
 *
 * @example
    livingcss('input.css', 'output.html');

    livingcss(['input.css', 'css/*.css'], 'styleguide.html', {
      loadcss: true,
      minify: true,
      preprocess: function(resolve, reject) {
        this.context.title = 'My Awesome Style Guide';
        resolve();
      },
      sectionOrder: ['buttons', 'forms', 'images'],
      tags: {
        color: function() {
          var section = this.sections[this.tag.description];

          if (section) {
            section.colors = section.colors || [];
            section.colors.push({
              name: this.tag.name,
              value: this.tag.type
            });
          }
        }
      },
      template: 'styleguide.hb'
    });
 */
function livingcss(source, dest, options) {
  if (!(this instanceof livingcss)) {
    return new livingcss(source, dest, options);
  }

  var destDir = path.dirname(path.resolve(dest));
  var context = {
    sections: [],
    stylesheets: [],
    scripts: [],
    title: 'LivingCSS Style Guide'
  };

  // defaults
  source = (typeof source === 'string' ? [source] : source);

  options = options || {};
  options.template = options.template || path.join(__dirname, 'template/template.hbs');
  options.sectionOrder = options.sectionOrder || [];
  options.tags = options.tags || [];
  options.minify = (typeof options.minify === 'undefined' ? false : options.minify);
  options.loadcss = (typeof options.loadcss === 'undefined' ? true : options.loadcss);

  // normalize sort order section names
  options.sectionOrder.forEach(function(value, index) {
    options[index] = value.toLowerCase();
  });

  // add custom tags
  for (var tag in options.tags) {
    if (!options.tags.hasOwnProperty(tag)) {
      continue;
    }

    tags[tag] = options.tags[tag];
  }

  // read all source files and handlebar templates
  utils.readFileGlobs(source, function(data, file) {
    parseComments(data, file, tags, context.sections);

    if (options.loadcss) {
      context.stylesheets.push(path.relative(destDir, file));
    }
  }).then(
    function success() {
      generate(dest, context, options);
    },
    function failure(err) {
      console.error(err.stack);
    })
  .catch(function(err) {
    console.error(err.stack);
  });
}

module.exports = livingcss;
module.exports.generate = generate;
module.exports.parseComments = parseComments;
module.exports.tags = tags;
module.exports.utils = utils;