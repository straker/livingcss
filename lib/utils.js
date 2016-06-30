/*jshint -W083 */

var fs = require('fs');
var glob = require('glob');

var whiteSpaceRegex = /\s/g;
var utils = {};

/**
 * Get an id by hyphen separating the name.
 *
 * @param {string} str - String to hyphenate.
 * @returns {string}
 */
utils.getId = function getId(str) {
  return encodeURIComponent(str.toLowerCase().replace(whiteSpaceRegex, '-'));
};

/**
 * Normalize a name.
 *
 * @param {string} name - Name to normalize.
 * @returns string
 */
utils.normalizeName = function normalizeName(name) {
  return name.toLowerCase();
};

/**
 * Generate the sort order of pages and sections.
 *
 * @param {object} context - Context to pass to handlebars.
 * @param {string[]} [context.pageOrder=[]] - Order that the pages should be sorted by.
 * @param {object[]} context.pages - List of pages.
 * @param {object[]} sortOrder - Array of objects of page name to array of section names.
 */
utils.generateSortOrder = function generateSortOrder(context, sortOrder) {
  context.pageOrder = context.pageOrder || [];

  // sortOrder can be:
  // sort just pages: array of page names
  // sort just sections: object of page names to array of section names
  // sort both: array of objects of page names to array of section names
  // sort some: array of objects and strings
  if (!Array.isArray(sortOrder)) {
    sortOrder = [sortOrder];
  }

  sortOrder.forEach(function(value, index) {
    // string page name
    if (typeof value === 'string') {
      context.pageOrder.push(utils.normalizeName(value));
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(function(name) {
        context.pageOrder.push(utils.normalizeName(name));
      });
      return;
    }

    // object of string page name to array of section names
    for (var prop in value) {
      if (!value.hasOwnProperty(prop)) {
        continue;
      }

      context.pageOrder.push(utils.normalizeName(prop));

      if (context.pages[prop]) {
        context.pages[prop].sectionOrder = context.pages[prop].sectionOrder || [];

        // sections
        value[prop].forEach(function(val) {
          context.pages[prop].sectionOrder.push(utils.normalizeName(val));
        });
      }
    }
  });
};

/**
 * Sort a list of categories (pages, sections) by a given array.
 *
 * @param {object[]} categories - List of categories.
 * @param {object} sortOrder - List of category names in the order they should be sorted. Any category not listed will be added to the end in the order encountered.
 */
utils.sortCategoryBy = function sortCategoryBy(categories, sortOrder) {
  categories.sort(function(a, b) {
    var aIndex = sortOrder.indexOf(utils.normalizeName(a.name));
    var bIndex = sortOrder.indexOf(utils.normalizeName(b.name));

    // default categories not in the section order to the bottom of the stack
    if (aIndex === -1) {
      return 1;
    }
    else if (bIndex === -1) {
      return -1;
    }

    return aIndex - bIndex;
  });
};

/**
 * Asynchronously read a list of glob pattern files and pass the list of files to
 * be read. Maintains file order.
 *
 * @param {string[]} patterns - List of glob pattern files.
 * @param {function} callback - Callback to execute for each read file.
 * @returns {Promise}
 */
utils.readFileGlobs = function readFileGlobs(patterns, callback) {
  patterns = (!Array.isArray(patterns) ? [patterns] : patterns);
  var promises = [];

  patterns.forEach(function(pattern) {

    promises.push(new Promise(function(resolve, reject) {
      glob(pattern, function(err, files) {
        if (err) {
          reject(err);
        }

        if (files.length === 0) {
          console.warn('pattern "' + pattern + '" does not match any file');
        }

        resolve(files);
      });
    }));

  });

  return new Promise(function(resolve, reject) {
    Promise.all(promises).then(function(fileList) {
      promises.length = 0;

      fileList.forEach(function(files) {
        promises.push(utils.readFiles(files, callback));
      });

      Promise.all(promises).then(function() {
        resolve();
      })
      .catch(function(err) {
        reject(err);
      });
    });
  })
  .catch(function(err) {
    throw err;
  });
};

/**
 * Asynchronously read a list of files and call the callback function for each of
 * them. Maintains file order.
 *
 * @param {string[]} patterns - List of glob pattern files.
 * @param {function} callback - Callback to execute for each read file.
 * @returns {Promise}
 */
utils.readFiles = function readFiles(files, callback) {
  if (!files || files.length === 0) {
    return Promise.resolve();
  }

  files = (!Array.isArray(files) ? [files] : files);
  var promises = [];

  files.forEach(function(file) {

    promises.push(new Promise(function(resolve, reject) {
      fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
          reject(err);
        }

        resolve([data, file]);
      });
    }));

  });

  return Promise.all(promises).then(function(files) {
    files.forEach(function(data) {
      callback.apply(null, data);
    });
  })
  .catch(function(err) {
    throw err;
  });
};

module.exports = utils;