/*jshint -W055 */
var fs = require('fs');
var path = require('path');
var Handlebars = require('handlebars');

var generate = require('./lib/generate');
var parseComments = require('./lib/parseComments');
var tags = require('./lib/tags');
var utils = require('./lib/utils');

/**
 * Parse comments in your CSS to generate a living style guide using Markdown.
 *
 * @param {string|string[]} source=[] - A single file, list of files, or glob file paths to be parsed to generate the style guide.
 * @param {string} [dest='.'] - Directory to output the style guide HTML. Defaults to the current directory.
 * @param {object} [options={}] - Configuration options.
 * @param {boolean} [options.loadcss=true] - If the style guide should load the css files that were used to generate it. The style guide will not move the styles to the output directory but will merely link to the styles in their current directory (so relative paths from the styles still work).
 * @param {boolean} [options.minify=false] - If the generated HTML should be minified.
 * @param {function} [options.preprocess] - Function that will be executed right before Handlebars is called with the context object. The function will be passed the context object, the Handlebars object, and the options passed to `livingcss` as parameters. Use this function to modify the context object or register Handlebars helpers or decorators.
 * @param {string[]|object[]} [options.sortOrder=[]] - List of pages and their sections in the order they should be sorted. Any page not listed will be added to the end in the order encountered. Can be an array of page names to just sort pages, an array of objects with page names as keys and an array of sections names as the values to sort both pages and sections, or any combination of both.
 * @param {object} [options.tags={}] - Object of custom tag names to callback functions that are called when the tag is encountered. The tag, the parsed comment, the block object, the list of sections, and the file are passed as the `this` object to the callback function.
 * @param {string} [options.template="template/template.hbs"] - Path to the Handlebars template to use for generating the HTML.
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

  dest = args[0] || process.cwd();

  var defaultTemplate = path.join(__dirname, 'template/template.hbs');
  var defaultPartials = path.join(__dirname, 'template/partials/*.hbs');
  var context = {
    footerHTML: 'Style Guide generated with <a href="https://github.com/straker/livingcss">LivingCSS</a>.',
    globalStylesheets: [],
    menuButtonHTML: '☰ Menu',
    pageOrder: [],
    pages: [],
    scripts: [],
    sections: [],
    stylesheets: [],
    title: 'LivingCSS Style Guide'
  };

  // defaults
  source = (typeof source === 'string' ? [source] : source);

  options = options || {};
  options.template = options.template || path.join(__dirname, 'template/template.hbs');
  options.sortOrder = options.sortOrder || [];
  options.tags = options.tags || [];
  options.minify = (typeof options.minify === 'undefined' ? false : options.minify);
  options.loadcss = (typeof options.loadcss === 'undefined' ? true : options.loadcss);

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
  ]).then(function(values) {
    utils.generateSortOrder(context, options.sortOrder);
    utils.sortCategoryBy(context.pages, context.pageOrder);

    context.allSections = context.sections;

    if (context.pages.length > 1) {
      context.navbar = context.pages.map(function(page) {
        return {
          name: page.name,
          url: page.id + '.html'
        };
      });
    }

    context.pages.forEach(function(page, index) {
      // deep copy context for each page
      var pageContext = JSON.parse(JSON.stringify(context));
      pageContext.sections = page.sections;

      // set current page selected
      if (context.navbar) {
        pageContext.navbar[index].selected = true;
      }

      // values[0] = handlebars template
      generate(path.join(dest, page.id + '.html'), values[0], pageContext, options);
    });
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