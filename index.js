/*jshint -W055 */
var fs = require('fs');
var path = require('path');
var Handlebars = require('handlebars');

var generate = require('./lib/generate');
var parseComments = require('./lib/parseComments');
var tags = require('./lib/tags');
var utils = require('./lib/utils');

if (typeof Object.assign !== 'function') {
  Object.assign = require('object-assign');
}

/**
 * Parse comments in your CSS to generate a living style guide using Markdown.
 *
 * @param {string|string[]} source=[] - A single file, list of files, or glob file paths to be parsed to generate the style guide.
 * @param {string} [dest='.'] - Path of the directory for the generated HTML. Defaults to the current directory.
 * @param {object} [options={}] - Configuration options.
 * @param {string} [options.template="template/template.hbs"] - Path to the Handlebars template to use for generating the HTML.
 * @param {string[]} [options.sectionOrder=[]] - List of root section names (a section without a parent) in the order they should be sorted. Any root section not listed will be added to the end in the order encountered.
 * @param {object} [options.tags={}] - Object of custom tag names to callback functions that are called when the tag is encountered. The tag, the parsed comment, the block object, the list of sections, and the file are passed as the `this` object to the callback function.
 * @param {boolean} [options.minify=false] - If the generated HTML should be minified.
 * @param {boolean} [options.loadcss=true] - If the style guide should load the css files that were used to generate it. The style guide will not move the styles to the output directory but will merely link to the styles in their current directory (so relative paths from the styles still work).
 * @param {function} [options.preprocess] - Function that will be executed right before Handlebars is called with the context object. The function will be passed the context object, the Handlebars object, and the options passed to `livingcss` as parameters. Use this function to modify the context object or register Handlebars helpers or decorators.
 *
 * @example
    livingcss('input.css', '/dist');

    livingcss(['input.css', 'css/*.css'], '/dist', {
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
  var args = Array.prototype.slice.call(arguments);

  // require parameters
  source = args.shift();

  // optional parameters
  if (typeof args[args.length - 1] !== 'string') {
    options = args.pop();
  }

  dest = args[0] || path.join(process.cwd(), '');

  var defaultTemplate = path.join(__dirname, 'template/template.hbs');
  var defaultPartials = path.join(__dirname, 'template/partials/*.hbs');
  var context = {
    pages: {},
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

  Promise.all([
    // read the handlebars template
    new Promise(function(resolve, reject) {
      fs.readFile(options.template, 'utf8', function(err, data) {
        if (err) {
          reject(err);
        }

        resolve(data);
      });
    }),

    // read all source files and handlebar templates
    utils.readFileGlobs(source, function(data, file) {
      parseComments(data, file, tags, context);

      // only load css files
      if (options.loadcss && path.extname(file) === '.css') {
        context.stylesheets.push(path.relative(dest, file));
      }
    }),

    // register default style guide partials
    utils.readFileGlobs(defaultPartials, function(data, file) {

      // make the name of the partial the name of the file
      var partialName = path.basename(file, path.extname(file));
      Handlebars.registerPartial(partialName, data);
    })
  ]).then(function success(values) {
    for (var page in context.pages) {
      if (!context.pages.hasOwnProperty(page)) {
        continue;
      }

      var pageContext = Object.assign({}, context);
      pageContext.sections = context.pages[page];

      // values[0] = handlebars template
      generate(path.join(dest, page + '.html'), values[0], pageContext, options);
    }
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