var Handlebars = require('handlebars');
var Promise = require("native-promise-only");
var path = require('path');
var utils = require('./utils');

/**
 * Load handlebar partials.
 *
 * @param {string[]} partials - List of glob files of handlebars partials to use in the template.
 */
function loadPartials(partials) {
  // no partials to load
  if (partials.length === 0) {
    return Promise.resolve();
  }

  return utils.readFileGlobs(partials, function(data, file) {
    // the name of the partial will be the name of the file
    var name = path.basename(file, path.extname(file));

    Handlebars.registerPartial(name, data);
  });
}

module.exports = loadPartials;