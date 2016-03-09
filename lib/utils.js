var fs = require('fs');
var glob = require('glob');

var whiteSpaceRegex = /\s/g;

/**
 * Get an id by hyphen separating the name.
 *
 * @param {string} str - String to hyphenate.
 * @returns {string}
 */
function getId(str) {
  return str.toLowerCase().replace(whiteSpaceRegex, '-');
}

/**
 * Sort a list of sections by a given array.
 *
 * @param {object[]} sections - List of sections.
 * @param {object} sectionOrder - List of root section names (a section without a parent) in the order they should be sorted. Any root section not listed will be added to the end in the order encountered.
 */
function sortSections(sections, sectionOrder) {
  sections.sort(function(a, b) {
    var aIndex = sectionOrder.indexOf(a.name.toLowerCase());
    var bIndex = sectionOrder.indexOf(b.name.toLowerCase());

    // default sections not in the section order to the bottom of the stack
    if (aIndex === -1) {
      return 1;
    }
    else if (bIndex === -1) {
      return -1;
    }

    return aIndex - bIndex;
  });
}

/**
 * Asynchronously read a list of glob pattern files and pass the list of files to
 * be read. Maintains file order.
 *
 * @param {string[]} patterns - List of glob pattern files.
 * @param {function} callback - Callback to execute for each read file.
 * @returns {Promise}
 */
function readFileGlobs(patterns, callback) {
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
        promises.push(readFiles(files, callback));
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
}

/**
 * Asynchronously read a list of files and call the callback function for each of
 * them. Maintains file order.
 *
 * @param {string[]} patterns - List of glob pattern files.
 * @param {function} callback - Callback to execute for each read file.
 * @returns {Promise}
 */
function readFiles(files, callback) {
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
}

module.exports.getId = getId;
module.exports.readFileGlobs = readFileGlobs;
module.exports.readFiles = readFiles;
module.exports.sortSections = sortSections;