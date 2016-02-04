var Handlebars = require('handlebars');
var Promise = require("native-promise-only");
var utils = require('./utils');

/**
 * Load handlebar partials.
 *
 * @param {object} options - Configuration options.
 */
function loadPartials(options) {
  // no partials to load
  if (options.partials.length === 0) {
    // console.log('Promise.resolve():', Promise.resolve());
    return Promise.resolve();
  }

  return utils.readFileGlobs(options.partials, function(data, file) {
    // the name of the partial will be the filename
    var name = file.slice(file.lastIndexOf('/') + 1, file.lastIndexOf('.'));

    Handlebars.registerPartial(name, data);
  });
}

module.exports = loadPartials;