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
 * @param {object} [options.tags={}] - Custom tags and their callback functions to parse them. The function will receive an object of the tag, the parsed comment, the block object, the list of sections, and the file as a parameter.
 * @param {boolean} [options.minify=true] - If the generated HTML should be minified.
 *
 * @example
    StyleGuideGenerator('input.css', 'output.html');

    StyleGuideGenerator('input.css', 'output.html', {
      tags: {
        myCustomTag: function(params) { return; }
      },
      sectionOrder: ['buttons', 'fields']
    });
 */
function StyleGuideGenerator(source, dest, options) {
  if (!(this instanceof StyleGuideGenerator)) {
    return new StyleGuideGenerator(source, dest, options);
  }

  // @property {Section[]} sections - List of sections.
  this.sections = [];

  // @property {object} tags - Tags and their callback function.
  this.tags = tags;

  // defaults
  source = (typeof source === 'string' ? [source] : source);
  options = options || {};
  options.template = options.template || path.join(__dirname, 'defaultTemplate.hbs');
  options.partials = (typeof options.partials === 'string' ? [options.partials] : options.partials || []);
  options.sectionOrder = options.sectionOrder || [];
  options.tags = options.tags || [];
  options.minify = (typeof options.minify === 'undefined' ? true : options.minify);

  // normalize sort order section names
  options.sectionOrder.forEach(function(value, index) {
    options[index] = value.toLowerCase();
  });

  // add custom tags
  for (var tag in options.tags) {
    if (!options.tag.hasOwnProperty(tag)) {
      continue;
    }

    this.tags[tag] = options.tags[tag];
  }

  // read all source files and handlebar templates
  Promise.all([
    utils.readFileGlobs(source, function(data, file) {
      parseComments(data, file, this.tags, this.sections);
    }.bind(this)),
    loadPartials(options)
  ]).then(
    function success() {
      generate(dest, this.sections, options);
    }.bind(this),
    function failure(err) {
      console.log('err:', err);
    })
  .catch(function(err) {
    console.log('err:', err);
  });
}

module.exports = StyleGuideGenerator;