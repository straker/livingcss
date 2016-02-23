/*jshint -W055 */
var fs = require('fs');
var path = require('path');
var Promise = require("native-promise-only");

var generate = require('./lib/generate');
var loadPartials = require('./lib/loadPartials');
var parseComments = require('./lib/parseComments');
var tags = require('./lib/tags');
var utils = require('./lib/utils');

/**
 * Generate a style guide using content driven content creation.
 *
 * @param {string|string[]} source=[] - List of glob files to generate the style guide from.
 * @param {string} dest - Path of the file for the generated HTML.
 * @param {object} [options={}] - Configuration options.
 * @param {string} [options.template="defaultTempalte.hbs"] - Path to the handlebars template to use for generating the HTML.
 * @param {string|string[]} [options.partials=[]] - List of glob files of handlebars partials used in the template.
 * @param {string[]} [options.sectionOrder=[]] - List of root section names (a section without a parent) in the order they should be sorted. Any root section not listed will be added to the end in the order encountered.
 * @param {object} [options.tags={}] - Custom tags and their callback functions to parse them. The function will have the tag, the parsed comment, the block object, the list of sections, and the file on the `this` object.
 * @param {boolean} [options.minify=true] - If the generated HTML should be minified.
 * @param {boolean} [options.handlebars=true] - Generate the style guide using handlebars. Set to false if you want to use a different templating engine, then use the `preprocess` function to get the JSON context object.
 * @param {boolean} [options.loadcss=true] - If the style guide should load the css files that were used to generate it.
 * @param {function} [options.preprocess] - Function that will get executed right before Handlebars is called with the context. Will be passed the context object, the Handlebars object, and the options passed to livingcss as parameters.
 *
 * @example
    livingcss('input.css', 'output.html');

    livingcss('input.css', 'output.html', {
      template: 'path/to/template.hbs',
      partials: 'path/to/partial.hbs',
      sectionOrder: ['buttons', 'fields'],
      tags: {
        myCustomTag: function() { return; }
      },
      minify: false,
      handlebars: true,
      loadcss: true,
      preprocess: function(context, Handlebars, options) {
        context.foo = bar;
      },
      postprocess: function(context, Handlebars, options) {
        // do some post processing work
      }
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
    scripts: []
  };

  // defaults
  source = (typeof source === 'string' ? [source] : source);

  options = options || {};
  options.template = options.template || path.join(__dirname, 'template/template.hbs');
  options.partials = (typeof options.partials === 'string' ? [options.partials] : options.partials || []);
  options.sectionOrder = options.sectionOrder || [];
  options.tags = options.tags || [];
  options.minify = (typeof options.minify === 'undefined' ? true : options.minify);
  options.handlebars = (typeof options.handlebars === 'undefined' ? true : options.handlebars);
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
  Promise.all([
    utils.readFileGlobs(source, function(data, file) {
      parseComments(data, file, tags, context.sections);

      if (options.loadcss && ) {
        context.stylesheets.push(path.relative(destDir, file));
      }
    }),
    loadPartials(options.partials)
  ]).then(
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
module.exports.loadPartials = loadPartials;
module.exports.parseComments = parseComments;
module.exports.tags = tags;
module.exports.utils = utils;